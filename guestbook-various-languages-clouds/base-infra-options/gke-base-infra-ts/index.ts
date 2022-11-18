import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as pulumiService from "@pulumi/pulumiService";
import { Cluster } from "./cluster";
import { masterVersion, nodeCount, nodeMachineType } from "./config";

// Build a name
const name = `gkebase-${pulumi.getStack()}`;

// Instantiate a gke cluster
const k8sCluster = new Cluster(name, {
    masterVersion: masterVersion,
    nodeCount: nodeCount,
    nodeMachineType: nodeMachineType,
});
const k8sProvider = k8sCluster.k8sProvider;

// Create a canary deployment to test that this cluster works.
const canaryLabels = { app: `canary-${name}` };
const canary = new k8s.apps.v1.Deployment("canary", {
    spec: {
        selector: { matchLabels: canaryLabels },
        replicas: 1,
        template: {
            metadata: { labels: canaryLabels },
            spec: { containers: [{ name, image: "nginx" }] },
        },
    },
}, { provider: k8sProvider });

// Export the Kubeconfig so that clients can easily access our cluster.
export const kubeconfig = k8sCluster.kubeconfig;

// Add a stack tag in Pulumi
const config = new pulumi.Config()
const stackTagName = config.get("stackTagName") ?? "Application"
const stackTagValue = config.get("stackTagValue") ?? "Guestbook"
const stackTag =  new pulumiService.StackTag("stackTag", {
    organization: pulumi.getOrganization(),
    project: pulumi.getProject(),
    stack: pulumi.getStack(),
    name: stackTagName,
    value: pulumi.interpolate`${stackTagValue}-${pulumi.getStack()}`
})