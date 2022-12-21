# Module that deploys the gitops operator.

# This component resource is currently written to use ArgoCD.
# But it could be substituted with Flux or Pulumi's K8s Operator.

from pulumi import ComponentResource, ResourceOptions, Output
import pulumi_kubernetes as k8s

import base64

class ArgoCdArgs:
  def __init__(self,
              namespace="argocd",
              chart="argo-cd",
              chart_version="5.4.4"
              ):
    self.namespace = namespace
    self.chart = chart
    self.chart_version = chart_version

class ArgoCd(ComponentResource):
  def __init__(self,
              name: str,
              args: ArgoCdArgs,
              opts: ResourceOptions=None):
    super().__init__('custom:operator:ArgoCd', name, {}, opts)

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

    # Deploy the operator using Helm
    chart_opts = opts
    chart_opts.parent = ns
    chart_id = f"{basename}-chart"
    oper = k8s.helm.v3.Release(chart_id,
        k8s.helm.v3.ReleaseArgs(
            chart=args.chart,
            version=args.chart_version,
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
    get_opts.depends_on=[oper]
    get_opts.parent=oper

    # URL for the Argo service UI
    service_uri = Output.all(chart_ready=oper.status, argo_id=oper.id).apply(lambda args: k8s.core.v1.Service.get("argo_service_lb",f"{args['argo_id']}-argocd-server",opts=get_opts).status.load_balancer.ingress[0].hostname)
    self.service_url = Output.concat("https://",service_uri)

    # Credentials for the Argo service UI
    self.service_admin_username = "admin" # default for Argo CD
    service_admin_password_encoded = Output.all(chart_ready=oper.status, ns_id=ns.id).apply(lambda args: k8s.core.v1.Secret.get("argo_service_password",f"{args['ns_id']}/argocd-initial-admin-secret", opts=get_opts).data["password"])
    self.service_admin_password = service_admin_password_encoded.apply(lambda pwd: base64.b64decode(pwd).decode('utf-8'))
    self.operator_ns = oper.status.apply(lambda status: ns.id)

    self.register_outputs({})

