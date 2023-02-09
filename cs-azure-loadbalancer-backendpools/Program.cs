/////
// CSharp translation of the ARM template presented here:
// https://learn.microsoft.com/en-us/azure/load-balancer/quickstart-load-balancer-standard-public-template
//
// Running the ARM template as per that tutorial produces an LB with all the right settings.
// So seeing how it would look in Pulumi ....

using Pulumi;
using Pulumi.AzureNative.Resources;
using Pulumi.AzureNative.Storage;
using Pulumi.AzureNative.Storage.Inputs;
using Pulumi.AzureNative.Network;
using System.Collections.Generic;

return await Pulumi.Deployment.RunAsync(() =>
{
    var config = new Pulumi.Config();
    var projectName = config.Get("projectName") ?? "mitchxlate";
    var adminUsername = config.Get("adminUsername") ?? "mitchadmin";
    var adminPassword = config.RequireSecret("adminPassword");
    var vmSize = config.Get("vmSize") ?? "Standard_D2s_v3";
    var subscriptionId = config.RequireSecret("subscriptionId");

    var rgName = $"{projectName}-rg";
    var lbName = $"{projectName}-lb";
    var lbSkuName = "Standard";
    var lbPublicIpAddressName = $"{projectName}-lbPublicIP";
    var lbPublicIPAddressNameOutbound = $"{projectName}-lbPublicIPOutbound";
    var lbFrontEndName = "LoadBalancerFrontEnd";
    var lbFrontEndNameOutbound = "LoadBalancerFrontEndOutbound";
    var lbBackendPoolName = "LoadBalancerBackEndPool";
    var lbBackendPoolNameOutbound = "LoadBalancerBackEndPoolOutbound";
    var lbProbeName = "loadBalancerHealthProbe";
    var nsgName = $"{projectName}-nsg";
    var vNetName = $"{projectName}-vnet";
    var vNetAddressPrefix = "10.0.0.0/16";
    var vNetSubnetName = "BackendSubnet";
    var vNetSubnetAddressPrefix = "10.0.0.0/24";
    var bastionName = $"{projectName}-bastion";
    var bastionSubnetName = "AzureBastionSubnet";
    var vNetBastionSubnetAddressPrefix = "10.0.1.0/24";
    var bastionPublicIPAddressName = $"{projectName}-bastionPublicIP";
    var vmStorageAccountType ="Premium_LRS";

    var baseId = $"/subscriptions/{subscriptionId}/resourceGroups/{rgName}/providers";
    var vNetSubnetId = $"{baseId}/providers/Microsoft.Network/virtualNetworks/{vNetName}/subnets/{vNetSubnetName}";
    var lbBackendPoolId = $"{baseId}/providers/Microsoft.Network/loadBalancers/{lbName}/backendAddressPools/{lbBackendPoolName}";
    var lbBackendPoolIdOutbound = $"{baseId}/providers/Microsoft.Network/loadBalancers/{lbName}/backendAddressPools/{lbBackendPoolNameOutbound}";

    // Create an Azure Resource Group
    var resourceGroup = new ResourceGroup(rgName, new ResourceGroupArgs
    {
       ResourceGroupName = rgName 
    });

    var vNet = new VirtualNetwork(vNetName, new VirtualNetworkArgs
    {
        VirtualNetworkName = vNetName,
        AddressSpace = new Pulumi.AzureNative.Network.Inputs.AddressSpaceArgs
        {
            AddressPrefixes = new[]
            {
                vNetAddressPrefix
            }
        }
    });
 
    {
      "type": "Microsoft.Network/networkSecurityGroups",
      "apiVersion": "2021-08-01",
      "name": "[variables('nsgName')]",
      "location": "[parameters('location')]",
      "properties": {
        "securityRules": [
          {
            "name": "AllowHTTPInbound",
            "properties": {
              "protocol": "*",
              "sourcePortRange": "*",
              "destinationPortRange": "80",
              "sourceAddressPrefix": "Internet",
              "destinationAddressPrefix": "*",
              "access": "Allow",
              "priority": 100,
              "direction": "Inbound"
            }
          }
        ]
      }
    },




    for (int vm = 0; vm < 3; vm++)
    {
        var networkInterfaceName = $"{projectName}-vm{vm}-networkInterface";
        var networkInterface = new NetworkInterface(networkInterfaceName, new()
        {
            EnableAcceleratedNetworking = true,
            IpConfigurations = new[]
            {
                new Pulumi.AzureNative.Network.Inputs.NetworkInterfaceIPConfigurationArgs
                {
                    Name = "ipconfig1",
                    PrivateIPAllocationMethod = "Dynamic",
                    Subnet = new Pulumi.AzureNative.Network.Inputs.SubnetArgs
                    {
                        Id = vNetSubnetId,
                    },
                    LoadBalancerBackendAddressPools = new[]
                    {
                        new Pulumi.AzureNative.Network.Inputs.BackendAddressPoolArgs
                        {
                            Id = lbBackendPoolId,
                        },
                        new Pulumi.AzureNative.Network.Inputs.BackendAddressPoolArgs
                        {
                            Id = lbBackendPoolIdOutbound,
                        },
                    }
                },
            },
            NetworkSecurityGroup = 
            Location = "eastus",
            NetworkInterfaceName = "test-nic",
            ResourceGroupName = "rg1",
        });
        var networkInterface = new NetworkInterface($"{projectName}-vm{vm}-networkInterface", new NetworkInterfaceArgs
        {
            IpConfigurations = new[]
            {
                new IpConfig

            }

        });
    }


    //////--------

    // Create an Azure resource (Storage Account)
    var storageAccount = new StorageAccount("sa", new StorageAccountArgs
    {
        ResourceGroupName = resourceGroup.Name,
        Sku = new SkuArgs
        {
            Name = SkuName.Standard_LRS
        },
        Kind = Kind.StorageV2
    });

    var storageAccountKeys = ListStorageAccountKeys.Invoke(new ListStorageAccountKeysInvokeArgs
    {
        ResourceGroupName = resourceGroup.Name,
        AccountName = storageAccount.Name
    });

    var primaryStorageKey = storageAccountKeys.Apply(accountKeys =>
    {
        var firstKey = accountKeys.Keys[0].Value;
        return Output.CreateSecret(firstKey);
    });

    // Export the primary key of the Storage Account
    return new Dictionary<string, object?>
    {
        ["primaryStorageKey"] = primaryStorageKey
    };
});