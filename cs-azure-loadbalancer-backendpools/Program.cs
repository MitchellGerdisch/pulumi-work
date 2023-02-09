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
using Pulumi.AzureNative.Network.Inputs;
using System.Collections.Generic;

return await Pulumi.Deployment.RunAsync(() =>
{
    var config = new Pulumi.Config();
    var projectName = config.Get("projectName") ?? "mitchxlate";
    var adminUsername = config.Get("adminUsername") ?? "mitchadmin";
    var adminPassword = config.RequireSecret("adminPassword");
    var vmSize = config.Get("vmSize") ?? "Standard_D2s_v3";
    var subscriptionId = config.Require("subscriptionId");

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
    var vNetSubnetId = $"{baseId}/Microsoft.Network/virtualNetworks/{vNetName}/subnets/{vNetSubnetName}";
    var lbBackendPoolId = $"{baseId}/Microsoft.Network/loadBalancers/{lbName}/backendAddressPools/{lbBackendPoolName}";
    var lbBackendPoolOutboundId = $"{baseId}/Microsoft.Network/loadBalancers/{lbName}/backendAddressPools/{lbBackendPoolNameOutbound}";
    var lbFrontEndId = $"{baseId}/Microsoft.Network/loadBalancers/{lbName}/frontendIpConfigurations/{lbFrontEndName}";
    var lbFrontEndOutboundId = $"{baseId}/Microsoft.Network/loadBalancers/{lbName}/frontendIpConfigurations/{lbFrontEndNameOutbound}";
    var lbProbeId = $"{baseId}/Microsoft.Network/loadBalancers/{lbName}/probes/{lbProbeName}";

    // Resource Group
    var resourceGroup = new ResourceGroup(rgName, new ()
    {
       ResourceGroupName = rgName, 
    });

    // Virtual Network
    var vNet = new VirtualNetwork(vNetName, new ()
    {
        VirtualNetworkName = vNetName,
        ResourceGroupName = resourceGroup.Name,
        AddressSpace = new Pulumi.AzureNative.Network.Inputs.AddressSpaceArgs
        {
            AddressPrefixes = new[]
            {
                vNetAddressPrefix
            }
        }
    });

    // Subnets
    // var bastionSubnet = new Subnet(bastionSubnetName, new Pulumi.AzureNative.Network.SubnetArgs
    var bastionSubnet = new Subnet(bastionSubnetName, new ()
    {
        SubnetName = bastionSubnetName,
        ResourceGroupName = resourceGroup.Name,
        VirtualNetworkName = vNet.Name,
        AddressPrefix = vNetBastionSubnetAddressPrefix
    });
    // var vNetSubnet = new Subnet(vNetSubnetName, new Pulumi.AzureNative.Network.SubnetArgs
    var vNetSubnet = new Subnet(vNetSubnetName, new ()
    {
        SubnetName = vNetSubnetName,
        ResourceGroupName = resourceGroup.Name,
        VirtualNetworkName = vNet.Name,
        AddressPrefix = vNetSubnetAddressPrefix
    });

    // Network Security Group
    var nsg = new NetworkSecurityGroup(nsgName, new ()
    {
        NetworkSecurityGroupName = nsgName,
        ResourceGroupName = resourceGroup.Name,
        SecurityRules = new[]
        {
            new Pulumi.AzureNative.Network.Inputs.SecurityRuleArgs
            {
                Name =  "AllowHTTPInbound",
                Protocol = "*",
                SourcePortRange = "*",
                DestinationPortRange = "80",
                SourceAddressPrefix = "Internet",
                DestinationAddressPrefix = "*",
                Access = "Allow",
                Priority = 100,
                Direction = "Inbound"
            }
        }
    });

    // Public IP Addresses
    var lbPublicIp = new PublicIPAddress(lbPublicIpAddressName, new()
    {
        PublicIpAddressName = lbPublicIpAddressName,
        ResourceGroupName = resourceGroup.Name,
        Sku = new Pulumi.AzureNative.Network.Inputs.PublicIPAddressSkuArgs
        {
            Name = lbSkuName
        },
        PublicIPAddressVersion = "IPv4",
        PublicIPAllocationMethod = "Static"
    });
    var lbPublicIpOutbound = new PublicIPAddress(lbPublicIPAddressNameOutbound, new()
    {
        PublicIpAddressName = lbPublicIPAddressNameOutbound,
        ResourceGroupName = resourceGroup.Name,
        Sku = new Pulumi.AzureNative.Network.Inputs.PublicIPAddressSkuArgs
        {
            Name = lbSkuName
        },
        PublicIPAddressVersion = "IPv4",
        PublicIPAllocationMethod = "Static"
    });

    // Loadbalancer
    var loadBalancer = new LoadBalancer(lbName, new ()
    {
        LoadBalancerName = lbName,
        ResourceGroupName = resourceGroup.Name,
        Sku = new LoadBalancerSkuArgs
        {
            Name = lbSkuName
        },
        FrontendIPConfigurations = new []
        {
           new FrontendIPConfigurationArgs 
           {
                Name = lbFrontEndName,
                PublicIPAddress =  new Pulumi.AzureNative.Network.Inputs.PublicIPAddressArgs
                {
                    Id = lbPublicIp.Id
                },
           },
           new FrontendIPConfigurationArgs 
           {
                Name = lbFrontEndNameOutbound,
                PublicIPAddress =  new Pulumi.AzureNative.Network.Inputs.PublicIPAddressArgs
                {
                    Id = lbPublicIpOutbound.Id
                },
           },
        },
        BackendAddressPools = new[]
        {
            new Pulumi.AzureNative.Network.Inputs.BackendAddressPoolArgs
            {
                Name = lbBackendPoolName,
            },
            new Pulumi.AzureNative.Network.Inputs.BackendAddressPoolArgs
            {
                Name = lbBackendPoolNameOutbound,
            },
        },
        LoadBalancingRules = new[]
        {
            new LoadBalancingRuleArgs
            {
                Name = "myHTTPRule",
                FrontendIPConfiguration = new SubResourceArgs
                {
                    Id = lbFrontEndId
                },
                BackendAddressPool = new SubResourceArgs
                {
                    Id = lbBackendPoolId
                },
                FrontendPort = 80,
                BackendPort = 80,
                EnableFloatingIP = false,
                IdleTimeoutInMinutes = 15,
                Protocol = "Tcp",
                EnableTcpReset = true,
                LoadDistribution = "Default",
                DisableOutboundSnat = true,
                Probe = new SubResourceArgs
                {
                    Id = lbProbeId,
                },
            },
        },
        Probes = new[]
        {
            new ProbeArgs
            {
                Name = lbProbeName,
                Protocol = "Tcp",
                Port = 80,
                IntervalInSeconds = 5,
                NumberOfProbes = 2,
            },
        },
        OutboundRules = new[]
        {
            new OutboundRuleArgs
            {
                Name = "myOutboundRule",
                AllocatedOutboundPorts = 10000,
                Protocol = "All",
                EnableTcpReset = false,
                IdleTimeoutInMinutes = 15,
                BackendAddressPool = new SubResourceArgs
                {
                    Id = lbBackendPoolOutboundId,
                },
                FrontendIPConfigurations = new SubResourceArgs
                {
                    Id = lbFrontEndOutboundId
                }
            }
        }
    });


    //   "properties": {
    //     "frontendIPConfigurations": [
    //       {
    //         "name": "[variables('lbFrontEndName')]",
    //         "properties": {
    //           "publicIPAddress": {
    //             "id": "[resourceId('Microsoft.Network/publicIPAddresses', variables('lbPublicIpAddressName'))]"
    //           }
    //         }
    //       },
    //       {
    //         "name": "[variables('lbFrontEndNameOutbound')]",
    //         "properties": {
    //           "publicIPAddress": {
    //             "id": "[resourceId('Microsoft.Network/publicIPAddresses', variables('lbPublicIPAddressNameOutbound'))]"
    //           }
    //         }
    //       }
    //     ],
    //     "backendAddressPools": [
    //       {
    //         "name": "[variables('lbBackendPoolName')]"
    //       },
    //       {
    //         "name": "[variables('lbBackendPoolNameOutbound')]"
    //       }
    //     ],
    //     "loadBalancingRules": [
    //       {
    //         "name": "myHTTPRule",
    //         "properties": {
    //           "frontendIPConfiguration": {
    //             "id": "[resourceId('Microsoft.Network/loadBalancers/frontendIPConfigurations', variables('lbName'), variables('lbFrontEndName'))]"
    //           },
    //           "backendAddressPool": {
    //             "id": "[resourceId('Microsoft.Network/loadBalancers/backendAddressPools', variables('lbName'), variables('lbBackendPoolName'))]"
    //           },
    //           "frontendPort": 80,
    //           "backendPort": 80,
    //           "enableFloatingIP": false,
    //           "idleTimeoutInMinutes": 15,
    //           "protocol": "Tcp",
    //           "enableTcpReset": true,
    //           "loadDistribution": "Default",
    //           "disableOutboundSnat": true,
    //           "probe": {
    //             "id": "[resourceId('Microsoft.Network/loadBalancers/probes', variables('lbName'), variables('lbProbeName'))]"
    //           }
    //         }
    //       }
    //     ],
    //     "probes": [
    //       {
    //         "name": "[variables('lbProbeName')]",
    //         "properties": {
    //           "protocol": "Tcp",
    //           "port": 80,
    //           "intervalInSeconds": 5,
    //           "numberOfProbes": 2
    //         }
    //       }
    //     ],
    //     "outboundRules": [
    //       {
    //         "name": "myOutboundRule",
    //         "properties": {
    //           "allocatedOutboundPorts": 10000,
    //           "protocol": "All",
    //           "enableTcpReset": false,
    //           "idleTimeoutInMinutes": 15,
    //           "backendAddressPool": {
    //             "id": "[resourceId('Microsoft.Network/loadBalancers/backendAddressPools', variables('lbName'), variables('lbBackendPoolNameOutbound'))]"
    //           },
    //           "frontendIPConfigurations": [
    //             {
    //               "id": "[resourceId('Microsoft.Network/loadBalancers/frontendIPConfigurations', variables('lbName'), variables('lbFrontEndNameOutbound'))]"
    //             }
    //           ]
    //         }
    //       }
    //     ]
    //   },
    //   "dependsOn": [
    //     "[resourceId('Microsoft.Network/publicIPAddresses', variables('lbPublicIpAddressName'))]",
    //     "[resourceId('Microsoft.Network/publicIPAddresses', variables('lbPublicIPAddressNameOutbound'))]"
    //   ]
    // },
    // {
    //   "type": "Microsoft.Network/publicIPAddresses",
    //   "apiVersion": "2021-08-01",
    //   "name": "[variables('lbPublicIpAddressName')]",
    //   "location": "[parameters('location')]",
    //   "sku": {
    //     "name": "[variables('lbSkuName')]"
    //   },
    //   "properties": {
    //     "publicIPAddressVersion": "IPv4",
    //     "publicIPAllocationMethod": "Static"
    //   }
    // },
    // {
    //   "type": "Microsoft.Network/publicIPAddresses",
    //   "apiVersion": "2021-08-01",
    //   "name": "[variables('lbPublicIPAddressNameOutbound')]",
    //   "location": "[parameters('location')]",
    //   "sku": {
    //     "name": "[variables('lbSkuName')]"
    //   },
    //   "properties": {
    //     "publicIPAddressVersion": "IPv4",
    //     "publicIPAllocationMethod": "Static"
    //   }
    // },

    // Network Interfaces
    for (int vm = 0; vm < 3; vm++)
    {
        var networkInterfaceName = $"{projectName}-vm{vm}-networkInterface";
        var networkInterface = new NetworkInterface(networkInterfaceName, new()
        {
            NetworkInterfaceName = networkInterfaceName,
            ResourceGroupName = resourceGroup.Name,
            EnableAcceleratedNetworking = true,
            IpConfigurations = new[]
            {
                new Pulumi.AzureNative.Network.Inputs.NetworkInterfaceIPConfigurationArgs
                {
                    Name = "ipconfig1",
                    PrivateIPAllocationMethod = "Dynamic",
                    Subnet = new Pulumi.AzureNative.Network.Inputs.SubnetArgs
                    {
                        Id = vNetSubnet.Id
                    },
                    LoadBalancerBackendAddressPools = new[]
                    {
                        new Pulumi.AzureNative.Network.Inputs.BackendAddressPoolArgs
                        {
                            Id = lbBackendPoolId,
                        },
                        new Pulumi.AzureNative.Network.Inputs.BackendAddressPoolArgs
                        {
                            Id = lbBackendPoolOutboundId,
                        },
                    }
                },
            },
            NetworkSecurityGroup = new Pulumi.AzureNative.Network.Inputs.NetworkSecurityGroupArgs
            {
                Id = nsg.Id
            }
        }, new CustomResourceOptions {DependsOn=loadBalancer});
    };


    // //////--------

    // // Create an Azure resource (Storage Account)
    // var storageAccount = new StorageAccount("sa", new StorageAccountArgs
    // {
    //     ResourceGroupName = resourceGroup.Name,
    //     Sku = new SkuArgs
    //     {
    //         Name = SkuName.Standard_LRS
    //     },
    //     Kind = Kind.StorageV2
    // });

    // var storageAccountKeys = ListStorageAccountKeys.Invoke(new ListStorageAccountKeysInvokeArgs
    // {
    //     ResourceGroupName = resourceGroup.Name,
    //     AccountName = storageAccount.Name
    // });

    // var primaryStorageKey = storageAccountKeys.Apply(accountKeys =>
    // {
    //     var firstKey = accountKeys.Keys[0].Value;
    //     return Output.CreateSecret(firstKey);
    // });

    // // Export the primary key of the Storage Account
    // return new Dictionary<string, object?>
    // {
    //     ["primaryStorageKey"] = primaryStorageKey
    // };
});