import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

// Interface for k8s operator component
export interface k8sOperatorArgs {
  namespaceName: string;
}

// Creates namespace and deploys pulumi operator
export class k8sOperator extends pulumi.ComponentResource {

  constructor(name: string, args: k8sOperatorArgs, opts?: pulumi.ComponentResourceOptions) {

    super("pequod:kubernetes:operator", name, args, opts);

    // Install the Pulumi Kubernetes Operator using Kustomize
    const pulumiKustomize = new k8s.kustomize.v2.Directory("pulumi-kubernetes-operator-config", {
      directory: "https://github.com/pulumi/pulumi-kubernetes-operator//operator/config/default/?ref=v2.0.0-beta.3",
    }, { parent: this });

    //// Not using helm chart for now since the published chart does not bring in v2 of the operator.
    // const namespace = new k8s.core.v1.Namespace("pulumi-kubernetes-operator-namespace", {
    //   metadata: {
    //     name: args.namespaceName,
    //   }
    // }, { parent: this });

    // Install the Pulumi Kubernetes Operator Helm chart
    // const pulumiK8sOperator = new k8s.helm.v3.Release("pulumi-kubernetes-operator", {
    //   chart: "oci://ghcr.io/pulumi/helm-charts/pulumi-kubernetes-operator",
    //   version: "2.0.0",
    //   namespace: namespace.metadata.name,
    // }, { parent: this });


    this.registerOutputs({});
  }
}