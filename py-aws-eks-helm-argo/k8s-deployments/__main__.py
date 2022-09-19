"""
- Deploys ArgoCD service
- Deploys one or more ArgoCD applications
"""

import pulumi
from pulumi.resource import ResourceOptions
import pulumi_kubernetes as k8s

from Gitops import OperatorArgs, Operator, ApplicationArgs, Application
from apps import apps

### Config
config = pulumi.Config()
basename = config.get("basename") or "argo-demo"
base_stack_project = config.require("base_stack_project")

base_stack_name = f"{pulumi.get_organization()}/{base_stack_project}/{pulumi.get_stack()}"
base_stack = pulumi.StackReference(base_stack_name)
kubeconfig = base_stack.get_output("kubeconfig")

# Instantiate K8s provider based on kubeconfig from the base infrastructure stack
k8s_provider = k8s.Provider('k8s-provider', kubeconfig=kubeconfig, delete_unreachable=True)

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

### Deploy Some Apps using config data
config_apps = config.get_object("apps")
for app in config_apps:
    app_namespace=app.get("app_name")
    app_name=app.get("app_name")
    app_repo_path=app.get("app_repo_path")
    app_repo_url=app.get("app_repo_url")
    app_repo_target_revision=app.get("app_repo_target_revision")

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