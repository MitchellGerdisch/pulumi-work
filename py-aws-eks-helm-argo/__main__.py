"""An AWS Python Pulumi program"""

import pulumi
from pulumi.resource import ResourceOptions
import pulumi_aws as aws
import pulumi_eks as eks
import pulumi_kubernetes as k8s
import base64

from Gitops import OperatorArgs, Operator, ApplicationArgs, Application
from apps import apps

basename = "argo-example"
# get the default VPCs to deploy the cluster
vpc = aws.ec2.get_vpc(default=True)

### create an EKS cluster
cluster = eks.Cluster(basename)
k8s_provider = cluster.provider
pulumi.export("kubeconfig", pulumi.Output.secret(cluster.kubeconfig))


### Deploy Operator
operator = Operator(basename, OperatorArgs(
    namespace="argocd"),
    opts=ResourceOptions(provider=k8s_provider)
)
pulumi.export("Service URL", operator.service_url)
pulumi.export("Admin Username", operator.service_admin_username)
pulumi.export("Admin Password", operator.service_admin_password)

### Deploy Some Apps
for app in apps:
    app_namespace=app["app_name"]
    app_name=app["app_name"]
    app_repo_path=app["app_repo_path"]
    app_repo_url=app["app_repo_url"]
    app_repo_target_revision=app["app_repo_target_revision"]

    resource_name = f"{basename}-{app_name}"
    app = Application(resource_name, ApplicationArgs(
        operator_namespace=operator.ns.id,
        app_namespace=app_namespace,
        app_name=app_name,
        app_repo_path=app_repo_path,
        app_repo_url=app_repo_url,
        app_repo_target_revision=app_repo_target_revision
        ),
        opts=ResourceOptions(provider=k8s_provider)
    )



# # define a namespace to deploy our app to.
# app_ns = k8s.core.v1.Namespace(
#     "sock-shop",
#     metadata={
#         "name": "sock-shop",
#     },
#     opts=pulumi.ResourceOptions(provider=cluster.provider, parent=cluster),
# )

# # deploy the argo app as a custom resource
# # FIXME: make this a component
# argo_app = k8s.apiextensions.CustomResource(
#     "sock-shop",
#     api_version="argoproj.io/v1alpha1",
#     kind="Application",
#     metadata=k8s.meta.v1.ObjectMetaArgs(
#         name="sock-shop",
#         namespace=ns.metadata.name,
#     ),
#     spec={
#         "destination": {
#             "namespace": app_ns.metadata.name,
#             "server": "https://kubernetes.default.svc",
#         },
#         "project": "default",
#         "source": {
#             "path": "sock-shop",
#             "repoURL": "https://github.com/argoproj/argocd-example-apps",
#             "targetRevision": "HEAD",
#         },
#         "syncPolicy": {"automated": {}},
#     },
#     opts=pulumi.ResourceOptions(provider=cluster.provider, depends_on=[operator, app_ns]),

# )