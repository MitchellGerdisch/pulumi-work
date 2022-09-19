# EKS Running ArgoCD
Based on https://github.com/jaxxstorm/pulumi-examples/tree/main/python/aws/eks_helm_argo

# Differences
- Uses pulumi.helm.chart instead or release so that the pulumi program can access resource information:
  - URL for the ARGO CD service
  - Initial admin password for the ARGO CD service
- Puts base argocd operator instantiation into a component resource 
- Puts argo app deployments into a component resource 