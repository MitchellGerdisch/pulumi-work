import * as pulumi from "@pulumi/pulumi";
import { Input } from "@pulumi/pulumi"
import * as network from "@pulumi/azure-native/network";
import * as resources from "@pulumi/azure-native/resources";
import * as containerservice from "@pulumi/azure-native/containerservice";
import * as storage from "@pulumi/azure-native/storage";

interface StandardAccountArgs {
    cidrBlock: Input<string>;
    subnetCidrBlocks: Input<string>[];
    tags?: pulumi.Input <{
        [key: string]: pulumi.Input<string>;
    }>;
};

export class StandardAccount extends pulumi.ComponentResource {
    public readonly resourceGroup: resources.ResourceGroup;
    public readonly network: network.VirtualNetwork;
    public readonly subnets: network.Subnet[];
    public readonly storageAccount: storage.StorageAccount;
    public readonly storageBucketName: pulumi.Output<string>;
    public readonly storageConnectionString: pulumi.Output<string>;

    constructor(name: string, args: StandardAccountArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:x:StandardAccount", name, args, opts);
        // All resources will share a resource group.
        this.resourceGroup = new resources.ResourceGroup(`${name}-rg`, {
        }, {parent: this, });

        // Creates a Virtual Network
        this.network = new network.VirtualNetwork(`${name}-vnet`, {
            resourceGroupName: this.resourceGroup.name,
            virtualNetworkName:`${name}-vnet`,
            addressSpace: { addressPrefixes: [args.cidrBlock]},
        }, {parent: this, ignoreChanges:["tags"] }); // This is because we hit this error: Custom diff for VirtualNetwork https://github.com/pulumi/pulumi-azure-nextgen-provider/issues/74

        // Create subnets
        this.subnets = [];
        for (let i = 0; i < (args.subnetCidrBlocks?.length ?? 0); i++) {
            const subnet = new network.Subnet(`${name}-subnet-${i}`, {
                resourceGroupName: this.resourceGroup.name,
                virtualNetworkName: this.network.name,
                subnetName: `${name}-subnet-${i}`,
                addressPrefix: args.subnetCidrBlocks[i],
            }, { parent: this.network, });
             this.subnets.push(subnet);
        }

        // Create a network security group resource
        const networkSecurityGroup = new network.NetworkSecurityGroup(`${name}-nsg`, {
            resourceGroupName: this.resourceGroup.name,
        }, { parent: this });

        // Create a security rule.  This is created in the network security group.
        // SSH Port 22 security group rule
        const security_rule1 = new network.SecurityRule(`${name}-nsg-ssh`, {
            access: "Allow",
            destinationAddressPrefix: "*",
            destinationPortRange: "22",
            direction: "InBound",
            networkSecurityGroupName: networkSecurityGroup.name,
            protocol: "*",
            priority: 100,
            resourceGroupName: this.resourceGroup.name,
            sourceAddressPrefix: "*",
            sourcePortRange: "*",
        }, { parent: networkSecurityGroup, ignoreChanges:["tags"], });

        this.storageAccount = new storage.StorageAccount(`${name}sa`, {
            resourceGroupName: this.resourceGroup.name,
            sku: {
                name: storage.SkuName.Standard_LRS,
            },
            kind: storage.Kind.StorageV2,
          }, { parent: this} );
          
        const storageContainer = new storage.BlobContainer(`${name}sc`, {
        resourceGroupName: this.resourceGroup.name,
        accountName: this.storageAccount.name,
        }, { parent: this.storageAccount });
        this.storageBucketName = storageContainer.name;

        // The primary key of the Storage Account
        const storageAccountKeys = pulumi
            .all([this.resourceGroup.name, this.storageAccount.name])
            .apply(([resourceGroupName, accountName]) =>
            storage.listStorageAccountKeys({ resourceGroupName, accountName })
            );

        // Extract the key
        const primaryStorageKey = storageAccountKeys.keys[0].value;
        // Build a connection string
        this.storageConnectionString = pulumi.interpolate`DefaultEndpointsProtocol=https;AccountName=${this.storageAccount.name};AccountKey=${primaryStorageKey}`;

        this.registerOutputs({});
    }
}