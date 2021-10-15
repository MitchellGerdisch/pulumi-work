import pulumi
from pulumi_aws.eks import get_cluster_auth
from kubernetes import client, config
from kubernetes.client.rest import ApiException
import time

### use python k8s client to wait for the ingress status to show the ALB information.
def get_alb_endpoint(args):
  if not pulumi.runtime.is_dry_run():
    cluster_id = args[0]
    kubeconfig = args[1]
    ingress_id = args[2] # of the form namespace/ingress_name
    namespace = ingress_id.split("/")[0]
    name = ingress_id.split("/")[1]
    cluster_address = kubeconfig["clusters"][0]["cluster"]["server"]
    cluster_auth_obj = get_cluster_auth(cluster_id)
    cluster_auth = cluster_auth_obj.token
    api_config = client.Configuration()
    api_config.host = cluster_address
    api_config.verify_ssl = False
    api_config.api_key['authorization'] = cluster_auth
    api_config.api_key_prefix['authorization'] = 'Bearer'
    api_instance = client.ExtensionsV1beta1Api(client.ApiClient(api_config))
    done = False
    lb_check_count = 0
    alb_endpoint = "ingress load balancer not found"
    while not done:
      try:
        api_response = api_instance.read_namespaced_ingress_status(name, namespace) 
        if api_response.status.load_balancer.ingress:
          alb_endpoint = api_response.status.load_balancer.ingress[0].hostname
          pulumi.log.info("Found ingress ALB.")
          done = True
        else:
          lb_check_count += 1
      except ApiException as e:
        lb_check_count += 1
      if lb_check_count > 24:
        done = True
      if not done:
        pulumi.log.info("Waiting for ingress ALB to be ready.")
        time.sleep(15)
    return f"{alb_endpoint}"
