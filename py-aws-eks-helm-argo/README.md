# EKS Running ArgoCD
Based on https://github.com/jaxxstorm/pulumi-examples/tree/main/python/aws/eks_helm_argo

# Differences
- Split into two stacks
  - Base infrastructure stack: deploys VPC and EKS cluster
  - Deployment stack: deploys operator and custom resources (apps)
- Uses pulumi.helm.chart instead or release so that the pulumi program can access resource information:
  - URL for the ARGO CD service
  - Initial admin password for the ARGO CD service
- Puts base argocd operator instantiation into a component resource 
- Puts argo app deployments into a component resource 

# Usage 
## Launch Base Infrastucture Stack
```bash
cd base-infra
pulumi stack select dev -c
pulumi up
```
## Launch Deployments Stack
You can use either the config file for the apps or the `apps.py` file for the apps. Both are supported to show different ways of doing stuff.
```bash
cd k8s-deployments
pulumi stack select dev -c
pulumi up
```
Point your browser at the `Service URL` and login to Argo using the `Admin Username` and `Admin Password`
- Note: `pulumi stack output "Admin Password" --show-secrets`

# Clean Up
`pulumi stack destroy` the k8s-deployment stack first and then the base-infra stack.
