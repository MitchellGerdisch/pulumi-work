import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

import { projectName, stackName, } from "./config";

const clusterStack = new pulumi.StackReference(`demo/demo-k8s-ts-cluster/${stackName}`);

export const storageBucketName = clusterStack.requireOutput("storageBucketName");
export const kubeconfig = clusterStack.requireOutput("kubeconfig");

// Export a Kubernetes provider instance that uses our cluster from above.
export const k8sProvider = new k8s.Provider(projectName, {
    kubeconfig: kubeconfig,
});
