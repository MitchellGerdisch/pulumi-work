import * as resources from "@pulumi/azure-native/resources";
import * as network from "@pulumi/azure-native/network";
import * as types from "@pulumi/azure-native/types"
import { ComponentResource, ComponentResourceOptions, Input, Output, Alias } from "@pulumi/pulumi";
import * as pulumi from "@pulumi/pulumi";

export interface MyComponentArgs {
  resourceGroupName: Input<string> | string;
  vnetName: Input<string> | string;
  vnetCidrBlock: string[];
  subnets: Input<types.input.network.SubnetArgs>[];
  rgAlias?: Input<string | Alias>[]; 
  vnetAlias?: Input<string | Alias>[];
  tags?: Input<{[key: string]: string}> | undefined;
};

export class MyComponent extends ComponentResource {
  public readonly resourceGroupName: Output<string>;
  public readonly vnetName: Output<string>;

  // Must have a constructor that defines the parameters and namespace - "custom:x:Storage" in this case.
  constructor(name: string, args: MyComponentArgs, opts?: ComponentResourceOptions) {
      super("custom:x:myComponent", name, args, opts);

      const myRG = new resources.ResourceGroup(`${name}-rg`, {
        resourceGroupName: args.resourceGroupName,
        tags: args.tags
      }, 
      {parent: this, 
          aliases: args.rgAlias
      }
      );

      const myVnet = new network.VirtualNetwork(`${name}-vnet`, {
        addressSpace: {
          addressPrefixes: args.vnetCidrBlock,
        },
        resourceGroupName: myRG.name,
        virtualNetworkName: args.vnetName,
        subnets: [{
          addressPrefix: "10.0.0.0/24",
          name: "subnet",
          privateEndpointNetworkPolicies: "Enabled",
          privateLinkServiceNetworkPolicies: "Enabled",
          type: "Microsoft.Network/virtualNetworks/subnets",
      }],
      }, {parent: this, 
        aliases: args.vnetAlias
          // aliases: ["urn:pulumi:dev::import-method-1::azure-native:network:VirtualNetwork::myImportedVnet"]
      }
      );

      this.resourceGroupName = myRG.name
      this.vnetName = myVnet.name

  }
}