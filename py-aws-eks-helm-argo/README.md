# EKS Running ArgoCD
Based on https://github.com/jaxxstorm/pulumi-examples/tree/main/python/aws/eks_helm_argo

# Differences
- Uses pulumi.helm.chart instead or release so that the pulumi program can access resource information:
  - URL for the ARGO CD service
  - Initial admin password for the ARGO CD service
- Puts base argocd helm instantiation into a component resource (TODO)
- Puts argo app into a component resource (TODO)