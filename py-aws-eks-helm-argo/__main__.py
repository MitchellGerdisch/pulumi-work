"""An AWS Python Pulumi program"""

import pulumi
from pulumi.resource import ResourceOptions
from pulumi_eks import ClusterArgs, Cluster 
import pulumi_aws as aws

from Network import VpcArgs, Vpc
from Gitops import OperatorArgs, Operator, ApplicationArgs, Application
from apps import apps

### Config
config = pulumi.Config()
basename = config.get("basename") or "argo-demo"

### create VPC
vpc = Vpc(basename, VpcArgs())

### create an EKS cluster
cluster = Cluster(basename, ClusterArgs(
    vpc_id=vpc.id,
    max_size=4,
))
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

# ### Deploy Some Apps
# for app in apps:
#     app_namespace=app["app_name"]
#     app_name=app["app_name"]
#     app_repo_path=app["app_repo_path"]
#     app_repo_url=app["app_repo_url"]
#     app_repo_target_revision=app["app_repo_target_revision"]

#     resource_name = f"{basename}-{app_name}"
#     app = Application(resource_name, ApplicationArgs(
#         operator_namespace=operator.ns.id,
#         app_namespace=app_namespace,
#         app_name=app_name,
#         app_repo_path=app_repo_path,
#         app_repo_url=app_repo_url,
#         app_repo_target_revision=app_repo_target_revision
#         ),
#         opts=ResourceOptions(provider=k8s_provider)
#     )

# config_apps = config.get_object("apps")
# ### Deploy Some Apps
# for app in config_apps:
#     app_namespace=app.get("app_name")
#     app_name=app.get("app_name")
#     app_repo_path=app.get("app_repo_path")
#     app_repo_url=app.get("app_repo_url")
#     app_repo_target_revision=app.get("app_repo_target_revision")

#     resource_name = f"{basename}-{app_name}"
#     app = Application(resource_name, ApplicationArgs(
#         operator_namespace=operator.ns.id,
#         app_namespace=app_namespace,
#         app_name=app_name,
#         app_repo_path=app_repo_path,
#         app_repo_url=app_repo_url,
#         app_repo_target_revision=app_repo_target_revision
#         ),
#         opts=ResourceOptions(provider=k8s_provider)
#     )