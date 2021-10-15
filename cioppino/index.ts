import * as pulumi from "@pulumi/pulumi";
import * as network from "@pulumi/azure-native/network";
import * as compute from "@pulumi/azure-native/compute";
import * as web from "@pulumi/azure-native/web";
import * as kubernetes from "@pulumi/kubernetes";

import * as k8s from "./k8s";
import { StandardAccount,} from "./landing-zone";
import { nameBase, instanceCount, vmSshKey } from "./config";
import {TargetType, DatadogDashboard } from "../demos-common/datadog";
import {installDatadogAgent} from "./datadog-agent-azure-native";

// Start with a nice broth.
// Create some base infrastructure (e.g. resource group, virtual network, storage account)
const lz = new StandardAccount(`${nameBase}`, {
    cidrBlock: "10.0.0.0/20",
    subnetCidrBlocks: ["10.0.0.0/21", "10.0.8.0/21"],
}); 
// Create a K8s (AKS in this case) cluster.
const cluster = new k8s.Cluster(`${nameBase}-cluster`, {
    resourceGroupName: lz.resourceGroup.name
})
export const resource_group = lz.resourceGroup.name;

// Add some clams and mussels.

// Transformation to install datadog agent if appropriate
installDatadogAgent()

// Creating N number of instances ( where N = instanceCount)
let instanceInfo: TargetType[] = []
for (let i = 0; i < instanceCount; i++) {
    // Creating public ip address
    const publicIp = new network.PublicIPAddress(`${nameBase}-publicipaddress-${i}`, {
        resourceGroupName: lz.resourceGroup.name,
        publicIPAllocationMethod: "Dynamic",
    });

    // Creating network interface
    const networkInterface = new network.NetworkInterface(`${nameBase}-nic-${i}`, {
        networkInterfaceName: `${nameBase}-nic-${i}`,
        resourceGroupName: lz.resourceGroup.name,
        ipConfigurations: [{
            name: `${nameBase}-nic-ipcfg-${i}`,
            subnet: { id: lz.subnets[0].id },
            publicIPAddress: { id: publicIp.id },
            privateIPAllocationMethod: "Dynamic"
        }]
    });

    // Creating user name for virtual machines
    const userName = "pulumi-admin";
    // Creating virtual machines names
    const vmName = `${nameBase}-vm-${i}`;
    // Creating virtual machines
    const webServer = new compute.VirtualMachine(vmName, {
        resourceGroupName: lz.resourceGroup.name,
        vmName: vmName,
        networkProfile: {
            networkInterfaces: [{ id: networkInterface.id }],
        },
        hardwareProfile: {
            vmSize: "Standard_A0",
        },

        osProfile: {
            computerName: vmName,
            adminUsername: userName,
            linuxConfiguration: {
                disablePasswordAuthentication: true,
                ssh: {
                    publicKeys: [{
                        keyData: vmSshKey.publicKeyOpenssh,
                        path: `/home/${userName}/.ssh/authorized_keys`, // reference the userName variable 
                    }]
                },
            },
        },
        storageProfile: {
            osDisk: {
                createOption: "FromImage",
            },
            imageReference: {
                publisher: "canonical",
                offer: "UbuntuServer",
                sku: "18.04-LTS",
                version: "latest",
            },
        },
        // tags: { "Name": vmName},  // Uncomment this out for the policy pack
    });

    const target = {
        "hostName": vmName,
        "hostId": webServer.name
    }
    instanceInfo.push(target);
}

const dashboard= new DatadogDashboard(nameBase, {
    targets: instanceInfo
 })
export const dashboardUrl = dashboard.dashboardUrl
export const privateSshKey = vmSshKey.privateKeyPem

// Add some scallops and lobster
// Deploy some resources on the K8s cluster created above.

// Name space and config map
const namespace = new kubernetes.core.v1.Namespace(`${nameBase}-ns`, {
    metadata: {
        name: `${nameBase}-ns`
    }
}, { provider: cluster.k8sProvider });
const configMap = new kubernetes.core.v1.ConfigMap(`${nameBase}-map`, {
    metadata: {
        namespace: namespace.metadata.name, 
    },
    data: { storageBucketName: lz.storageBucketName },
}, { provider: cluster.k8sProvider });

// Create a microservice using the MicroService class defined in custom module k8s
const nginxComponent = new k8s.MicroService(`${nameBase}-nginx`, {
    namespace: namespace,
    configMap: configMap,
    image: "nginx:1.18", // 1.18 -> 1.19
    ports: [{ name: "http", port: 80, }],
}, { provider: cluster.k8sProvider, });

// Deploy another microservice using helm chart
const nginxHelm = new kubernetes.helm.v3.Chart(`${nameBase}-helm`, {
    namespace: namespace.metadata.name,
    fetchOpts: {
        repo: "https://charts.bitnami.com/bitnami",
    },
    chart: "nginx",
    version: "5.6.0", // 5.6.0 -> 5.7.0
    transformations: [ // Helm Chart: https://github.com/bitnami/charts/blob/master/bitnami/nginx/templates/deployment.yaml
        // (obj: any) => {
        //     if (obj.kind == "Deployment") {
        //         obj.spec.replicas = 2
        //     }
        // }
    ],
}, { provider: cluster.k8sProvider, });

// Toss in some veggies
// Deploy Azure serverless function.

// create a consumption plan for the azure function
const plan = new web.AppServicePlan(`${nameBase}-plan`, {
  resourceGroupName: lz.resourceGroup.name,
  name: "consumption-plan",
  sku: {
    name: "Y1",
    tier: "Dynamic",
  },
});

// Function App
const function_app = new web.WebApp(`${nameBase}-functionapp`, {
  resourceGroupName: lz.resourceGroup.name,
  serverFarmId: plan.id,
  kind: "functionapp",
  siteConfig: {
    appSettings: [
      { name: "AzureWebJobsStorage", value: lz.storageConnectionString },
      { name: "FUNCTIONS_EXTENSION_VERSION", value: "~3" },
      { name: "FUNCTIONS_WORKER_RUNTIME", value: "node" },
      { name: "WEBSITE_NODE_DEFAULT_VERSION", value: "10.14.1" },
      {
        name: "WEBSITE_RUN_FROM_PACKAGE", value: "https://mikhailworkshop.blob.core.windows.net/zips/app.zip",
      },
    ],
  },
});

export const endpoint = pulumi.interpolate`https://${function_app.defaultHostName}/api/hello`;
