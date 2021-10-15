/* 
 * An opinionated custom resource to configure the base network and related subnets and rules.
 * It is specific to the architecture diagram and so loses some reusability for other architectures.
 * But that could be addressed by pulling out the more opinionated parts (e.g. the subnets and security group configs)
 */

import * as pulumi from "@pulumi/pulumi";
import { Input } from "@pulumi/pulumi"
import * as network from "@pulumi/azure-nextgen/network/latest";
import * as resources from "@pulumi/azure-nextgen/resources/latest";

// These are the input properties supported by the custom resource.
// Can be anything that makes sense. Supporting location and tags in this example.
// - location: azure location in which to create the resources
// - vnetCidr: main block for the network.
// - spaCidr: block for the SPA/front-end subnet
// - beCidr: block for the backend API subnet
// - crmCidr: block for the CRM subnet
interface BaseNetArgs {
    location: Input<string>;
    vnetCidr: Input<string>;
    spaCidr: Input<string>;
    beCidr: Input<string>;
    crmCidr: Input<string>;
};

export class BaseNet extends pulumi.ComponentResource {
    // The output properties for the custom resource.
    // Can be anything that makes sense. 
    // In this case, the resourceGroup is needed in the calling program.
    // The network and subnets are just included for examples but not used in the calling program at this time.
    public readonly resourceGroup: resources.ResourceGroup;
    public readonly network: network.VirtualNetwork;
    public readonly spaSubnet: network.Subnet;
    public readonly beSubnet: network.Subnet;
    public readonly crmSubnet: network.Subnet;

    // Standard constructor declaration 
    // - name: this is standard resource declaration name. In the case of this custom resource, it is also used as a basis for the resource names.
    // - args: the input properties for the custom resource as declared in the Interface above.
    // - opts: supports standard Pulumi resource options (e.g. the protect flag or the dependsOn flag).
    constructor(name: string, args: BaseNetArgs, opts?: pulumi.ComponentResourceOptions) {
        // MUST HAVE this super() call to register the custom resource.
        // You'll see this string in the pulumi up
        super("custom:x:BaseNet", name, args, opts);

        const location = args.location

        // Deploy the resource group.
        this.resourceGroup = new resources.ResourceGroup(`${name}-rg`, {
            resourceGroupName: pulumi.interpolate`${name}-rg`,
            location: location,
        }, {parent: this, });
        const rgName = this.resourceGroup.name

        // Creates a Virtual Network
        this.network = new network.VirtualNetwork(`${name}-vnet`, {
            resourceGroupName: rgName,
            location: location,
            virtualNetworkName:`${name}-vnet`,
            addressSpace: { addressPrefixes: [args.vnetCidr]},
        }, {parent: this, }); //ignoreChanges:["tags"] }); // This is because we hit this error: Custom diff for VirtualNetwork https://github.com/pulumi/pulumi-azure-nextgen-provider/issues/74

        // Create subnets 
        // frontend subnet and rules
        this.spaSubnet = new network.Subnet(`${name}-spa-subnet`, {
            resourceGroupName: rgName,
            virtualNetworkName: this.network.name,
            subnetName: `${name}-spa-subnet`,
            addressPrefix: args.spaCidr,
            serviceEndpoints: [{
                service: "Microsoft.Storage",
            }],
        }, { parent: this.network });

        const spaSecGrp = new network.NetworkSecurityGroup(`${name}-spa-nsg`, {
            networkSecurityGroupName: `${name}-spa-nsg`,
            resourceGroupName: rgName,
            location: location
        }, {parent: this})

        const spaDenyAllDefault =  new network.SecurityRule(`${name}-spa-deny-all`, {
            resourceGroupName: rgName,
            networkSecurityGroupName: spaSecGrp.name,
            securityRuleName: `${name}-spa-deny-all`,
            access: "Deny",
            direction: "InBound",
            protocol: "*",
            destinationAddressPrefix: args.spaCidr,
            destinationPortRange: "*",
            sourceAddressPrefix: "*",
            sourcePortRange: "*",
            priority: 1100,
        }, {parent: this});
        const spaHttps =  new network.SecurityRule(`${name}-spa-https`, {
            resourceGroupName: rgName,
            networkSecurityGroupName: spaSecGrp.name,
            securityRuleName: `${name}-spa-https`,
            access: "Allow",
            direction: "InBound",
            protocol: "TCP",
            destinationAddressPrefix: args.spaCidr,
            destinationPortRange: "443",
            sourceAddressPrefix: "*",
            sourcePortRange: "*",
            priority: 100,
        }, {parent: this});

        // backend API subnet and rules
        this.beSubnet = new network.Subnet(`${name}-be-subnet`, {
            resourceGroupName: rgName,
            virtualNetworkName: this.network.name,
            subnetName: `${name}-be-subnet`,
            addressPrefix: args.beCidr,
            serviceEndpoints: [{
                service: "Microsoft.AzureCosmosDB",
            }],
            
        }, { parent: this.network, dependsOn: this.spaSubnet })

        const beSecGrp = new network.NetworkSecurityGroup(`${name}-be-nsg`, {
            networkSecurityGroupName: `${name}-be-nsg`,
            resourceGroupName: rgName,
            location: location
        }, { parent: this })

        const beDenyAllDefault =  new network.SecurityRule(`${name}-be-deny-all`, {
            resourceGroupName: rgName,
            networkSecurityGroupName: spaSecGrp.name,
            securityRuleName: `${name}-be-deny-all`,
            access: "Deny",
            direction: "InBound",
            protocol: "*",
            destinationAddressPrefix: args.beCidr,
            destinationPortRange: "*",
            sourceAddressPrefix: "*",
            sourcePortRange: "*",
            priority: 1200,
        }, { parent: this });
        const beHttps =  new network.SecurityRule(`${name}-be-https`, {
            resourceGroupName: rgName,
            networkSecurityGroupName: spaSecGrp.name,
            securityRuleName: `${name}-be-https`,
            access: "Allow",
            direction: "InBound",
            protocol: "TCP",
            destinationAddressPrefix: args.beCidr,
            destinationPortRange: "443",
            sourceAddressPrefix: args.spaCidr,
            sourcePortRange: "*",
            priority: 200,
        }, { parent: this, })
        const crm2beHttps =  new network.SecurityRule(`${name}-be-crm2be`, {
            resourceGroupName: rgName,
            networkSecurityGroupName: spaSecGrp.name,
            securityRuleName: `${name}-be-crm2be`,
            access: "Allow",
            direction: "InBound",
            protocol: "TCP",
            destinationAddressPrefix: args.beCidr,
            destinationPortRange: "443",
            sourceAddressPrefix: args.crmCidr,
            sourcePortRange: "*",
            priority: 250,
        }, { parent: this, })

        // CRM API subnet and rules
        this.crmSubnet = new network.Subnet(`${name}-crm-subnet`, {
            resourceGroupName: rgName,
            virtualNetworkName: this.network.name,
            subnetName: `${name}-crm-subnet`,
            addressPrefix: args.crmCidr,
        }, { parent: this.network, dependsOn: this.beSubnet })

        const crmSecGrp = new network.NetworkSecurityGroup(`${name}-crm-nsg`, {
            networkSecurityGroupName: `${name}-crm-nsg`,
            resourceGroupName: rgName,
            location: location
        }, {parent: this})

        const crmDenyAllDefault =  new network.SecurityRule(`${name}-crm-deny-all`, {
            resourceGroupName: rgName,
            networkSecurityGroupName: spaSecGrp.name,
            securityRuleName: `${name}-crm-deny-all`,
            access: "Deny",
            direction: "InBound",
            protocol: "*",
            destinationAddressPrefix: args.crmCidr,
            destinationPortRange: "*",
            sourceAddressPrefix: "*",
            sourcePortRange: "*",
            priority: 1300,
        }, {parent: this});
        const crmHttps =  new network.SecurityRule(`${name}-crm-https`, {
            resourceGroupName: rgName,
            networkSecurityGroupName: spaSecGrp.name,
            securityRuleName: `${name}-crm-https`,
            access: "Allow",
            direction: "InBound",
            protocol: "TCP",
            destinationAddressPrefix: args.crmCidr,
            destinationPortRange: "443",
            sourceAddressPrefix: args.beCidr,
            sourcePortRange: "*",
            priority: 300,
        }, {parent: this})

        // This tells pulumi that resource creation is complete and so will register with the stack
        this.registerOutputs({});
    }
}
