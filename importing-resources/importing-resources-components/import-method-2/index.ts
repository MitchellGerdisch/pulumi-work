import * as pulumi from "@pulumi/pulumi";
import * as azure_native from "@pulumi/azure-native";
import * as myComponent from "./myComponent";

const importedRgName = "resourceGroup1cb26d3d"
const importedVnetName = "virtualNetworkc733c1b6"

// Import RG in component resource
//pulumi import azure-native:resources:ResourceGroup myImportedRg /subscriptions/32b9cb2e-69be-4040-80a6-02cd6b2cc5ec/resourceGroups/resourceGroup1cb26d3d --parent name=urn:pulumi:dev::import-method-2::custom:x:myComponent::importedComponent

// Import VNET into component resource
// pulumi import azure-native:network:VirtualNetwork myImportedVnet "/subscriptions/32b9cb2e-69be-4040-80a6-02cd6b2cc5ec/resourceGroups/resourceGroup1cb26d3d/providers/Microsoft.Network/virtualNetworks/virtualNetworkc733c1b6"

// BEFORE first run, modify component resource code to comment out resources.
// This is to create an empty component resource.
const myImportedComponent = new myComponent.MyComponent("importedComponent", {
  resourceGroupName: importedRgName,
  vnetName: importedVnetName,
  vnetCidrBlock: ["10.0.0.0/16"],
  subnets: [{
    addressPrefix: "10.0.0.0/24",
    name: "subnet",
    privateEndpointNetworkPolicies: "Enabled",
    privateLinkServiceNetworkPolicies: "Enabled",
    type: "Microsoft.Network/virtualNetworks/subnets",
  }],
});
