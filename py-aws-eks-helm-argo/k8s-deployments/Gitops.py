# Module that provides two component resources:
# - Operator: Deploys the gitops operator.
# - Application: Configures the operator to watch a Repo and continuously update.

# This component resource is currently written to use ArgoCD.
# But it could be substituted with Flux of Pulumi's K8s Operator.

from pulumi import ComponentResource, ResourceOptions, Output
import pulumi_kubernetes as k8s

class ApplicationArgs:
  def __init__(self,
              app_namespace="argocd",
              app_name=None,
              app_repo_url=None,
              app_repo_path=None,
              app_repo_target_revision=None,
              operator_namespace=None,
              ):
    self.app_namespace = app_namespace
    self.app_name = app_name
    self.app_repo_url = app_repo_url
    self.app_repo_path = app_repo_path
    self.app_repo_target_revision = app_repo_target_revision
    self.operator_namespace = operator_namespace

class Application(ComponentResource):
  def __init__(self,
              name: str,
              args: ApplicationArgs,
              opts: ResourceOptions=None):
    super().__init__('custom:Gitops:Application', name, {}, opts)

    basename = f"{name}-app"


    # define a namespace to deploy our app to.
    ns_opts = opts
    ns_opts.parent=self
    ns = k8s.core.v1.Namespace(f"{basename}-ns",
      metadata={
        "name": args.app_namespace
      },
      opts=ns_opts
    )

    # Deploy the app via argo as a custom resource
    app_opts = opts
    app_opts.parent=self
    app = k8s.apiextensions.CustomResource(
        args.app_name,
        api_version="argoproj.io/v1alpha1",
        kind="Application",
        metadata=k8s.meta.v1.ObjectMetaArgs(
            name=args.app_name,
            namespace=args.operator_namespace
        ),
        spec={
            "destination": {
                "namespace": ns.metadata.name,
                "server": "https://kubernetes.default.svc",
            },
            "project": "default",
            "source": {
                "path": args.app_repo_path,
                "repoURL": args.app_repo_url,
                "targetRevision": args.app_repo_target_revision
            },
            "syncPolicy": {"automated": {}},
        },
        opts=app_opts
    )