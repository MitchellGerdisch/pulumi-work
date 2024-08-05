# K8s-Operator

Gathered some elements to demo k8s operator:
- deploy-operator-py: This stack can be run to deploy the k8s operator onto a k8s stack. It was tested with an EKS stack.
- deploy-infra-by-operator: This stack deploys a custom resource for the operator. The custom resource points at a simple stack that creates a random resource.

## Set up
- Find an ESC environment that projects a pulumi config value, `kubeconfig` for a k8s cluster.
- Run the `deploy-operator-py` stack first.
- Run the `deploy-infra-by-operator` stack second.

## Helpful Commands
Set up `KUBECONFIG` to point at the k8s cluster's kubeconfig.
You'll also need to be logged into to AWS if it's an EKS cluster.

- Get stack status and results
  - `kubectl get stacks` 
  - `kubectl get stack my-stack-a91b99a9 -o json` 
-  Get secrets and their values
  - `kubectl get secrets`
  - `kubectl get secret accesstoken-e758cd6a`
