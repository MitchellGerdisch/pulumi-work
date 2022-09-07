import * as pulumi from "@pulumi/pulumi";
import * as azure_native from "@pulumi/azure-native";
import * as myComponent from "./myComponent";

const importedRgName = "resourceGroup1cb26d3d"
const importedVnetName = "virtualNetworkc733c1b6"

// // Import RG
// // pulumi import azure-native:resources:ResourceGroup myImportedRg "/subscriptions/32b9cb2e-69be-4040-80a6-02cd6b2cc5ec/resourceGroups/resourceGroup1cb26d3d"
const rgAlias =  ["urn:pulumi:dev::import-method-1b::azure-native:resources:ResourceGroup::myImportedRg"]

// // Import VNET
// // pulumi import azure-native:network:VirtualNetwork myImportedVnet "/subscriptions/32b9cb2e-69be-4040-80a6-02cd6b2cc5ec/resourceGroups/resourceGroup1cb26d3d/providers/Microsoft.Network/virtualNetworks/virtualNetworkc733c1b6"
const vnetAlias = ["urn:pulumi:dev::import-method-1b::azure-native:network:VirtualNetwork::myImportedVnet"]

pulumi.runtime.registerStackTransformation(args => {
    if (args.type === "azure-native:resources:ResourceGroup") {
      return {
        props: args.props, // just pass along the same props
        opts: pulumi.mergeOptions(args.opts, { aliases: rgAlias })
      }
    } else if (args.type === "azure-native:network:VirtualNetwork") {
      return {
        props: args.props,
        opts: pulumi.mergeOptions(args.opts, { aliases: vnetAlias })
      }
    } else {
      return undefined;
    }
  }
)

// Create component resource with aliases for  direct imported resources
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
  },
  // {transformations: [args => {
  //   if (args.type === "azure-native:resources:ResourceGroup") {
  //     const mergedOpts = pulumi.mergeOptions(args.opts, {aliases: rgAlias})
  //     return {
  //       props: args.props, // just pass along the same props
  //       opts: mergedOpts
  //     }
  //   }
  //   if (args.type === "azure-native:network:VirtualNetwork") {
  //     return {
  //       props: args.props,
  //       opts: pulumi.mergeOptions(args.opts, { aliases: vnetAlias })
  //     }
  //   }
  //   return undefined;
  // }
// ]}
);