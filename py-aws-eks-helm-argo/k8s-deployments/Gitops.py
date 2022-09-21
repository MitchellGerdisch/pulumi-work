# Module that provides two component resources:
# - Operator: Deploys the gitops operator.
# - Application: Configures the operator to watch a Repo and continuously update.

# This component resource is currently written to use ArgoCD.
# But it could be substituted with Flux of Pulumi's K8s Operator.

from pulumi import ComponentResource, ResourceOptions, Output
import pulumi_kubernetes as k8s

import base64


class OperatorArgs:
  def __init__(self,
              namespace=None,
              ):
    self.namespace = namespace

class Operator(ComponentResource):
  def __init__(self,
              name: str,
              args: OperatorArgs,
              opts: ResourceOptions=None):
    super().__init__('custom:Gitops:Operator', name, {}, opts)

    basename = f"{name}-oper"

    # define an namespace for the argocd operator to live in
    ns_opts = opts
    ns_opts.parent=self
    ns = k8s.core.v1.Namespace(f"{basename}-ns",
      metadata={
        "name": args.namespace
      },
      opts=ns_opts
    )

    # Deploy the ArgoCD operator using Helm
    chart_opts = opts
    chart_opts.parent = ns
    chart_id = f"{basename}-chart"
    argo = k8s.helm.v3.Release(chart_id,
        k8s.helm.v3.ReleaseArgs(
            chart="argo-cd",
            version="5.4.4",
            namespace=ns.metadata.name,
            repository_opts=k8s.helm.v3.RepositoryOptsArgs(
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
        opts=chart_opts
    )

    # for the "gets" below
    get_opts = opts
    get_opts.depends_on=[argo]
    get_opts.parent=argo

    # URL for the Argo service UI
    service_uri = Output.all(chart_ready=argo.status, argo_id=argo.id).apply(lambda args: k8s.core.v1.Service.get("argo_service_lb",f"{args['argo_id']}-argocd-server",opts=get_opts).status.load_balancer.ingress[0].hostname)
    self.service_url = Output.concat("https://",service_uri)

    # Credentials for the Argo service UI
    self.service_admin_username = "admin" # default for Argo CD
    service_admin_password_encoded = Output.all(chart_ready=argo.status, ns_id=ns.id).apply(lambda args: k8s.core.v1.Secret.get("argo_service_password",f"{args['ns_id']}/argocd-initial-admin-secret", opts=get_opts).data["password"])
    self.service_admin_password = service_admin_password_encoded.apply(lambda pwd: base64.b64decode(pwd).decode('utf-8'))
    self.namespace = argo.status.apply(lambda status: ns.id)

    self.register_outputs({})

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