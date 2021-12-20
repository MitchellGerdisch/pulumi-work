# Module that provides two component resources:
# - Operator: Deploys the gitops operator.
# - Application: Configures the operator to watch a Repo and continuously update.

# This component resource is currently written to use ArgoCD.
# But it could be substituted with Flux of Pulumi's K8s Operator.

from pulumi import ComponentResource, ResourceOptions, Output, runtime
import pulumi_kubernetes as k8s

import base64


class OperatorArgs:
  def __init__(self,
              namespace="argocd",
              ):
    self.namespace = namespace

class Operator(ComponentResource):
  def __init__(self,
              name: str,
              args: OperatorArgs,
              opts: ResourceOptions=None):
    super().__init__('custom:Gitops:Operator', name, {}, opts)

    basename = f"{name}-oper"
    namespace = args.namespace

    # define an namespace for the argocd operator to live in
    ns_opts = opts
    ns_opts.parent=self
    self.ns = k8s.core.v1.Namespace(f"{basename}-ns",
      metadata={
        "name": args.namespace
      },
      opts=ns_opts
    )

    # Deploy the ArgoCD operator using Helm
    chart_opts = opts
    chart_opts.parent = self.ns
    chart_id = f"{basename}-chart"
    self.argo = k8s.helm.v3.Chart(chart_id,
        k8s.helm.v3.ChartOpts(
            chart="argo-cd",
            namespace=self.ns.metadata.name,
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
        opts=chart_opts
    )

    # for the "gets" below
    get_opts = opts
    get_opts.depends_on=[self.argo]
    get_opts.parent=self.argo

    # URL for the Argo service UI
    service_uri = Output.all(chart_ready=self.argo.ready, ns_id=self.ns.id).apply(lambda args: k8s.core.v1.Service.get("argo_service_lb",f"{args['ns_id']}/{chart_id}-argocd-server",opts=get_opts).status.load_balancer.ingress[0].hostname)
    self.service_url = Output.concat("https://",service_uri)

    # Credentials for the Argo service UI
    self.service_admin_username = "admin" # default for Argo CD
    service_admin_password_encoded = Output.all(chart_ready=self.argo.ready, ns_id=self.ns.id).apply(lambda args: k8s.core.v1.Secret.get("argo_service_password",f"{args['ns_id']}/argocd-initial-admin-secret", opts=get_opts).data["password"])
    self.service_admin_password = service_admin_password_encoded.apply(lambda pwd: base64.b64decode(pwd).decode('utf-8'))

    self.register_outputs({})

class ApplicationArgs:
  def __init__(self,
              namespace="argocd",
              ):
    self.namespace = namespace

class Application(ComponentResource):
  def __init__(self,
              name: str,
              args: ApplicationArgs,
              opts: ResourceOptions=None):
    super().__init__('custom:Gitops:Application', name, {}, opts)

    basename = f"{name}-app"
    namespace = args.namespace

    # define an namespace for the argo managed deployment to live in
    ns_opts = opts
    ns_opts.parent=self
    self.ns = k8s.core.v1.Namespace(f"{basename}-ns",
      metadata={
        "name": namespace
      },
      opts=ns_opts
    )

    # Deploy the app via argo
    app_opts = opts
    app_opts.parent=self
    self.app = k8s.apiextensions.CustomResource(
        "sock-shop",
        api_version="argoproj.io/v1alpha1",
        kind="Application",
        metadata=k8s.meta.v1.ObjectMetaArgs(
            name="sock-shop",
            namespace=self.ns.metadata.name,
        ),
        spec={
            "destination": {
                "namespace": self.ns.metadata.name,
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
        opts=app_opts
    )