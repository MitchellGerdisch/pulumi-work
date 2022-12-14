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
  * NOTE the 3_deploy-test-stack stack has a couple of loops with variables to drive how many successful stacks to deploy and how many failing stacks to deploy.

## K8s Operator Helpful Tools
* `kubectl get stacks`
* `kubectl get stack STACKNAME_FROM_GET_STACKS -o json`

## Grafana Tips and Tricks
* Use the JSON found on https://github.com/pulumi/pulumi-kubernetes-operator/blob/master/docs/metrics.md 
 page to import a new dashboard.
  * From Dashboards menu icon on the left you'll see an import option.
  * Select that and import the JSON
  * Note the Active Stacks will show both successful and failed stacks.
* To add some semblance of a useful panel for the "stacks_failing" metric do the following:
  * Click add panel
  * Select Metric and search for `stacks_failing`
  * The Select Operations
    * Select Aggregate - Sum
  * This results in a graph that accumulates the failed stacks over time.

