import * as gcp from "@pulumi/gcp";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { masterVersion, nodeCount, nodeMachineType, password, username } from "./config";

export interface ClusterArgs {
    // no inputs at this time
}

export class Cluster extends pulumi.ComponentResource {
    public readonly kubeconfig: pulumi.Output<string>;
    public readonly k8sConfig: pulumi.Output<string>;
    public readonly k8sProvider: k8s.Provider;
    constructor(name: string, args?: ClusterArgs, opts?: pulumi.ComponentResourceOptions) {

        super("custom:resource:Cluster", name, args, opts);
    
        // Create the GKE cluster and export it.
        const k8sCluster = new gcp.container.Cluster(`${name}-cluster`, {
            // We can't create a cluster with no node pool defined, but we want to only use
            // separately managed node pools. So we create the smallest possible default
            // node pool and immediately delete it.
            initialNodeCount: 1,
            removeDefaultNodePool: true,
            minMasterVersion: masterVersion,
        }, {parent: this});

        const nodePool = new gcp.container.NodePool(`${name}-primary-node-pool`, {
            cluster: k8sCluster.name,
            initialNodeCount: nodeCount,
            location: k8sCluster.location,
            nodeConfig: {
                preemptible: true,
                machineType: nodeMachineType,
                oauthScopes: [
                    "https://www.googleapis.com/auth/compute",
                    "https://www.googleapis.com/auth/devstorage.read_only",
                    "https://www.googleapis.com/auth/logging.write",
                    "https://www.googleapis.com/auth/monitoring",
                ],
            },
            version: masterVersion,
            management: {
                autoRepair: true,
            },
        }, {
            dependsOn: [k8sCluster], 
            parent: this
        }) 

    // Manufacture a GKE-style Kubeconfig. Note that this is slightly "different" because of the way GKE requires
    // gcloud to be in the picture for cluster authentication (rather than using the client cert/key directly).
        const k8sconfig = pulumi.
    all([ k8sCluster.name, k8sCluster.endpoint, k8sCluster.masterAuth ]).
    apply(([ name, endpoint, auth ]) => {
        const context = `${gcp.config.project}_${gcp.config.zone}_${name}`;
        return `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${auth.clusterCaCertificate}
    server: https://${endpoint}
  name: ${context}
contexts:
- context:
    cluster: ${context}
    user: ${context}
  name: ${context}
current-context: ${context}
kind: Config
preferences: {}
users:
- name: ${context}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: gke-gcloud-auth-plugin
      installHint: Install gke-gcloud-auth-plugin for use with kubectl by following
        https://cloud.google.com/blog/products/containers-kubernetes/kubectl-auth-changes-in-gke
      provideClusterInfo: true
`;
    });

        this.kubeconfig = pulumi.secret(k8sconfig)

        // Export a Kubernetes provider instance that uses our cluster from above.
        this.k8sProvider = new k8s.Provider("gkeK8s", {
            kubeconfig: this.kubeconfig,
        }, {
            dependsOn: [nodePool],
        })
    }
}

// // Manufacture a GKE-style Kubeconfig. Note that this is slightly "different" because of the way GKE requires
// // gcloud to be in the picture for cluster authentication (rather than using the client cert/key directly).
// export function genGkeKubeconfig( clusterName: pulumi.Output<string>, clusterEndpoint: pulumi.Output<string>, masterAuth: pulumi.Output<gcp.types.output.container.ClusterMasterAuth>) : pulumi.Output<string> {
//         const k8sConfig = pulumi.
//             all([ clusterName, clusterEndpoint, masterAuth ]).
//             apply(([ name, endpoint, auth ]) => {
//                 const context = `${gcp.config.project}_${gcp.config.zone}_${name}`;
//                 return `apiVersion: v1
// clusters:
// - cluster:
//     certificate-authority-data: ${auth.clusterCaCertificate}
//     server: https://${endpoint}
//   name: ${context}
// contexts:
// - context:
//     cluster: ${context}
//     user: ${context}
// name: ${context}
// current-context: ${context}
// kind: Config
// preferences: {}
// users:
// - name: ${context}
// user:
//     exec:
//     apiVersion: client.authentication.k8s.io/v1beta1
//     command: gke-gcloud-auth-plugin
//     installHint: Install gke-gcloud-auth-plugin for use with kubectl by following
//         https://cloud.google.com/blog/products/containers-kubernetes/kubectl-auth-changes-in-gke
//     provideClusterInfo: true
// `;
//             });
//     return pulumi.secret(k8sConfig);
// }

