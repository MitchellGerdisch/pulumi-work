# Pulumi Operator Testing and Tinkering

Links of note:
* https://github.com/pulumi/pulumi-kubernetes-operator
* https://github.com/pulumi/pulumi-kubernetes-operator/blob/master/docs/metrics.md 
* https://github.com/pulumi/pulumi-kubernetes-operator#using-pulumi
* https://github.com/pulumi/pulumi-kubernetes-operator#create-pulumi-stack-customresources 

## Steps
* Deploy a K8s cluster (e.g. eks or aks, or whatever)
* get the kubeconfig from the K8s cluster and store in a file, e.g. kubeconfig.txt
  * export KUBECONFIG=kubeconfig.txt
* Run `pulumi up` for the 3 projects in the numbered order given
  * prometheus needs to be deployed before operator