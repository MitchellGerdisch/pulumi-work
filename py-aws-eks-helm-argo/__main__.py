"""An AWS Python Pulumi program"""

import pulumi
from pulumi.resource import ResourceOptions
import pulumi_aws as aws
from pulumi_aws import provider
from pulumi_aws.iam import group
import pulumi_eks as eks
import pulumi_kubernetes as k8s
import base64

basename = "argo-example"
# get the default VPCs to deploy the cluster
vpc = aws.ec2.get_vpc(default=True)
subnets = aws.ec2.get_subnet_ids(vpc_id=vpc.id)

# create a simple EKS cluster
cluster = eks.Cluster(basename)
pulumi.export("kubeconfig", pulumi.Output.secret(cluster.kubeconfig))

#### argocd operator install ####
# define an namespace for the argocd deployment to live in
ns = k8s.core.v1.Namespace(
    "argocd",
    metadata={
        "name": "argocd",
    },
    opts=pulumi.ResourceOptions(provider=cluster.provider, parent=cluster, aliases=[pulumi.Alias(name='ns')]),
)

# we use helm chart instead of helm release since this provides access to resource specifics such as the URL for the service.
argo = k8s.helm.v3.Chart(
    "argocd",
    k8s.helm.v3.ChartOpts(
        chart="argo-cd",
        namespace=ns.metadata.name,
        fetch_opts=k8s.helm.v3.FetchOpts(
            repo="https://argoproj.github.io/argo-helm"
        ),
        values={
            "server": {
                "service": {
                    "type": "LoadBalancer",
                },
            }
        },
    ),
    opts=pulumi.ResourceOptions(provider=cluster.provider, parent=ns),
)

argo_service_uri = pulumi.Output.concat("https://",argo.get_resource("v1/Service","argocd-server",ns.id).status.load_balancer.ingress[0].hostname)
pulumi.export("argocd_service_url", argo_service_uri)

# argo_service_password = argo.get_resource("v1/Secret","argocd-secret",ns.id) #.data.password.apply(lambda pwd: base64(pwd))
argo_service_password_encoded = k8s.core.v1.Secret.get("argo_service_password","argocd/argocd-initial-admin-secret").data["password"]
argo_service_password = argo_service_password_encoded.apply(lambda pwd: base64.b64decode(pwd).decode('utf-8'))
pulumi.export("argocd_service_password", argo_service_password)


# deploy the argo app as a custom resource
# FIXME: make this a component

# define a namespace to deploy our app to.
app_ns = k8s.core.v1.Namespace(
    "sock-shop",
    metadata={
        "name": "sock-shop",
    },
    opts=pulumi.ResourceOptions(provider=cluster.provider, parent=cluster),
)

# Deploy the app via argo
argo_app = k8s.apiextensions.CustomResource(
    "sock-shop",
    api_version="argoproj.io/v1alpha1",
    kind="Application",
    metadata=k8s.meta.v1.ObjectMetaArgs(
        name="sock-shop",
        namespace=ns.metadata.name,
    ),
    spec={
        "destination": {
            "namespace": app_ns.metadata.name,
            "server": "https://kubernetes.default.svc",
        },
        "project": "default",
        "source": {
            "path": "sock-shop",
            "repoURL": "https://github.com/argoproj/argocd-example-apps",
            "targetRevision": "HEAD",
        },
        "syncPolicy": {"automated": {}},
    },
    opts=pulumi.ResourceOptions(provider=cluster.provider, depends_on=[argo, app_ns]),
)

