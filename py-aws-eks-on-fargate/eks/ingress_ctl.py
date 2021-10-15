import pulumi
from pulumi import ComponentResource, ResourceOptions,Output
from pulumi_kubernetes.rbac.v1 import ClusterRole,ClusterRoleBinding,RoleRefArgs,SubjectArgs
from pulumi_kubernetes.apps.v1 import Deployment, DeploymentSpecArgs
from pulumi_kubernetes.core.v1 import ContainerArgs, PodSpecArgs, PodTemplateSpecArgs, ServiceAccount, Namespace
from pulumi_kubernetes.meta.v1 import ObjectMetaArgs, LabelSelectorArgs
from pulumi_kubernetes.helm.v3 import Chart, ChartOpts, FetchOpts
from pulumi_kubernetes.yaml import ConfigFile
import pulumi_aws as aws
from utils.ingress_ctl_jsons import ingress_ctl_iam_policy
import json

class IngressCtlArgs:

  def __init__(self,
              proj_name=None,
              provider=None,
              oidc_provider=None, 
              cluster_name=None,
              vpc_id=None,
              aws_region="us-east-2",
              namespace_name=None,
                ):
    self.provider = provider
    self.proj_name = proj_name
    self.oidc_provider = oidc_provider
    self.cluster_name = cluster_name
    self.vpc_id = vpc_id
    self.aws_region = aws_region
    self.namespace_name = namespace_name

class IngressCtl(ComponentResource):

  def __init__(self,
                name: str,
                args: IngressCtlArgs,
                opts: ResourceOptions = None):

    super().__init__("custom:resource:IngressCtl", name, {}, opts)

    k8s_provider = args.provider
    proj_name = args.proj_name
    oidc_provider = args.oidc_provider
    cluster_name = args.cluster_name
    vpc_id = args.vpc_id
    aws_region = args.aws_region
    ns_name = args.namespace_name
    controller_name = f"{proj_name}-alb-controller"
    service_account_name = "aws-lb-controller-serviceaccount"
    service_account_full = f"system:serviceaccount:{ns_name}:{service_account_name}"

    # Using the helm chart to deploy the AWS ALB controller as per:
    # https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/deploy/installation/
    # 
    # The code below is based on the instructions for the helm chart as well as this workshop:
    # https://pulumi.awsworkshop.io/50_eks_platform/30_deploy_ingress_controller.html

    # Create the assume_role_policy based on the cluster OIDC provider properties.
    assume_role_policy = Output.all(oidc_provider.arn, oidc_provider.url).apply(
      lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "Federated": f"{args[0]}"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
              "StringEquals": {
                f"{args[1]}:sub": service_account_full
              }
            }
          }
        ]
      })
    )
    self.ingress_ctl_iam_role = aws.iam.Role(f"{proj_name}-ingress-ctl-iam-role",
      description="Permissions required by the Kubernetes AWS ALB Ingress controller to do it's job.",
      force_detach_policies=True,
      assume_role_policy=assume_role_policy,
      opts=ResourceOptions(parent=self))
      
    # Set up IAM policy using the permissions provided alongside the helm chart and found here:
    # https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.1.2/docs/install/iam_policy.json
    # and stored locally in ingress_ctl_jsons.py
    self.ingress_ctl_iam_policy = aws.iam.Policy(f"{proj_name}-ingress-ctl-iam-policy",
      policy=json.dumps(ingress_ctl_iam_policy),
      opts=ResourceOptions(parent=self, depends_on=[self.ingress_ctl_iam_role]))


    # Attach the policy to the role created above
    self.ingress_ctl_role_attachment = aws.iam.PolicyAttachment(f"{proj_name}-ingress-ctl-iam-role-attachment",
      policy_arn=self.ingress_ctl_iam_policy.arn,
      roles=[self.ingress_ctl_iam_role.name],
      opts=ResourceOptions(parent=self, depends_on=[self.ingress_ctl_iam_role])
    )

    # Create a namespace in which to deploy the controller
    self.controller_namespace = Namespace(ns_name,
      metadata=ObjectMetaArgs(
        name=ns_name,
			  labels={"app.kubernetes.io/name": "aws-load-balancer-controller"}
		  ),
      opts=ResourceOptions(provider=k8s_provider, parent=self),
    )

    self.ingress_ctl_k8s_service_account = ServiceAccount(service_account_name,
      metadata=ObjectMetaArgs(
        name=service_account_name,
        namespace=self.controller_namespace.metadata.name,
        annotations={"eks.amazonaws.com/role-arn": self.ingress_ctl_iam_role.arn.apply(lambda arn: arn)},
      ),
      opts=ResourceOptions(parent=self, provider=k8s_provider, depends_on=[self.ingress_ctl_role_attachment]))

    # helm steps from the above referenced documentation has a few steps ... 
    # helm-1: "Add the EKS chart repo to helm" is not applicable in pulumi
    # This is a helper function to remove the .status field from CRDs and charts because it's not a valid field and Pulumi doesn't like it. 
    # See https://github.com/pulumi/pulumi-kubernetes/issues/800
    def remove_status(obj, opts):
      if obj["kind"] == "CustomResourceDefinition":
        del obj["status"]

    # helm-2: install TargetGroupBinding CRD that was downloaded from here: https://github.com/aws/eks-charts/blob/master/stable/aws-load-balancer-controller/crds/crds.yaml
    # skipped since helm chart creates the target bindings so adding the crd causes an error due to duplication
    # self.alb_controller_crd = ConfigFile(f"{proj_name}-alb-crd",
    #   file="aws-lb-controller-crd.yaml",
    #   transformations=[remove_status],
    #   opts=ResourceOptions(parent=self, provider=k8s_provider))

    # helm-3: install helm chart
    # Chart found here: https://artifacthub.io/packages/helm/aws/aws-load-balancer-controller
    alb_controller_name = f"{proj_name}-alb-controller"
    self.alb_controller = Chart(alb_controller_name,
      ChartOpts(
          chart="aws-load-balancer-controller", # Get this from the second line of the helm chart artifact hub TL;DR
          fetch_opts=FetchOpts(
            repo="https://aws.github.io/eks-charts" # Get this from the first line of the helm chart artifcat hub TL;DR
          ),
          namespace=self.controller_namespace.metadata.name,
          # Need to set these values as per the chart docs
          values={
            "region":aws_region,
            "vpcId":vpc_id,
            "clusterName":cluster_name, 
            "serviceAccount": {
            # Need to assign the ServiceAccount created above. 
            # Without this, the helm chart creates a ServiceAccount but it doesn't have the permissions needed to allow the controller to create ALBs.
              "create": False,
              "name": service_account_name, #self.ingress_ctl_k8s_service_account.metadata.name 
            },
            "podLabels": {
              "app": "aws-lb-controller"
            }
          },
          transformations=[remove_status],
      ),
      opts=ResourceOptions(parent=self, provider=k8s_provider, depends_on=[self.ingress_ctl_k8s_service_account]))

    self.register_outputs({})
