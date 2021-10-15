import * as pulumi from "@pulumi/pulumi";
import * as azuread from "@pulumi/azuread";
import * as containerservice from "@pulumi/azure-native/containerservice";
import * as k8s from "@pulumi/kubernetes";
import * as tls from "@pulumi/tls";

export class Cluster extends pulumi.ComponentResource {
    public readonly kubeconfig: pulumi.Output<string>;
    public readonly k8sProvider: k8s.Provider;

    constructor(name: string, args: ClusterArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:x:K8sCluster", name, args, opts);

        const nameBase = name
        const resourceGroupName = args.resourceGroupName
        
        // Create an AD service principal
        const adApp = new azuread.Application(`${nameBase}-aks`, {
            displayName: `${nameBase}-aks`,
        }, {parent: this});

        const adSp = new azuread.ServicePrincipal(`${nameBase}-sp`, {
            applicationId: adApp.applicationId,
        }, {parent: this});
        
        // Create the Service Principal Password
        const adSpPassword = new azuread.ServicePrincipalPassword(`${nameBase}-sp-pwd`, {
            servicePrincipalId: adSp.id,
            endDate: "2099-01-01T00:00:00Z",
        }, {parent: this});
        
        // Generate an SSH key
        const sshKey = new tls.PrivateKey(`${nameBase}-ssh-key`, {
            algorithm: "RSA",
            rsaBits: 4096,
        }, {parent: this});
        
        const managedClusterName = `${nameBase}-aks`
        const cluster = new containerservice.ManagedCluster(managedClusterName, {
            resourceGroupName: resourceGroupName,
            agentPoolProfiles: [{
                count: 3,
                maxPods: 110,
                mode: "System",
                name: "agentpool",
                nodeLabels: {},
                osDiskSizeGB: 30,
                osType: "Linux",
                type: "VirtualMachineScaleSets",
                vmSize: "Standard_DS2_v2",
            }],
            dnsPrefix: resourceGroupName,
            enableRBAC: true,
            kubernetesVersion: "1.21.2",
            linuxProfile: {
                adminUsername: "testuser",
                ssh: {
                    publicKeys: [{
                        keyData: sshKey.publicKeyOpenssh,
                    }],
                },
            },
            nodeResourceGroup: `MC_azure-go_${managedClusterName}`,
            servicePrincipalProfile: {
                clientId: adApp.applicationId,
                secret: adSpPassword.value,
            },
        }, {parent: this});
        
        const creds = pulumi.all([cluster.name, resourceGroupName]).apply(([clusterName, rgName]) => {
            return containerservice.listManagedClusterUserCredentials({
                resourceGroupName: rgName,
                resourceName: clusterName,
            });
        });
        
        const encoded = creds.kubeconfigs[0].value;
        this.kubeconfig = encoded.apply(enc => Buffer.from(enc, "base64").toString());

        this.k8sProvider = new k8s.Provider(`${nameBase}-k8sprovider`, {
            kubeconfig: this.kubeconfig,
        }, {parent: this});

        this.registerOutputs({});
    }
};

export interface ClusterArgs {
    resourceGroupName: pulumi.Input<string>;
};

/*
 * MicroService Class
 */
export class MicroService extends pulumi.ComponentResource {
    public readonly deployment: k8s.apps.v1.Deployment;
    public readonly service: k8s.core.v1.Service;

    constructor(name: string, args: MicroServiceArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:x:K8sMicroService", name, args, opts);

        const appLabels = {
            ...args.labels,
            appClass: name,
        };

        this.deployment = new k8s.apps.v1.Deployment(name, {
            metadata: {
                namespace: args.namespace.metadata.name,
                labels: appLabels,
            },
            spec: {
                replicas: args.replicas ?? 2,
                selector: { matchLabels: appLabels },
                template: {
                    metadata: { labels: appLabels, },
                    spec: {
                        containers: [{
                            name: name,
                            image: args.image,
                            ports: args.ports?.map(it => { return { name: it.name, containerPort: it.port, } }),
                            envFrom: [{ configMapRef: { name: args.configMap?.metadata.apply(m => m.name) } }],
                        }],
                    },
                },
            },
        }, { parent: this });

        this.service = new k8s.core.v1.Service(name, {
            metadata: {
                namespace: args.namespace.metadata.name,
                labels: appLabels,
            },
            spec: {
                type: "LoadBalancer",
                ports: args.ports?.map(it => { return { targetPort: it.name, port: it.port, } }),
                selector: appLabels,
            },
        }, { parent: this.deployment });

        this.registerOutputs({});

    }
};

export interface MicroServiceArgs {
    namespace: k8s.core.v1.Namespace;
    image: pulumi.Input<string>;
    labels?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;
    configMap: k8s.core.v1.ConfigMap;
    replicas?: pulumi.Input<number>;
    ports: K8sMicroServicePort[];
};

export interface K8sMicroServicePort {
    port: pulumi.Input<number>;
    name: pulumi.Input<string>;
};
