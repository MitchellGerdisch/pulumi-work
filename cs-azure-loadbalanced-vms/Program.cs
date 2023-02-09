/////
// CSharp translation of the ARM template presented here:
// https://learn.microsoft.com/en-us/azure/load-balancer/quickstart-load-balancer-standard-public-template
//
// Running the ARM template as per that tutorial produces an LB with all the right settings.
// So seeing how it would look in Pulumi ....

//// TODO: Add VM declarations as per the ARM template /////

using Pulumi;
using Pulumi.AzureNative.Resources;
using Pulumi.AzureNative.Storage;
using Pulumi.AzureNative.Storage.Inputs;
using Pulumi.AzureNative.Network;
using Pulumi.AzureNative.Network.Inputs;
using System.Collections.Generic;

return await Pulumi.Deployment.RunAsync(() =>
{
    // Analogous to the ARM template's "parameters" section
    var config = new Pulumi.Config();
    var projectName = config.Get("projectName") ?? Pulumi.Deployment.Instance.ProjectName;
    var adminUsername = config.Get("adminUsername") ?? "vmadmin";
    var adminPassword = config.RequireSecret("adminPassword");
    var vmSize = config.Get("vmSize") ?? "Standard_D2s_v3";
    var subscriptionId = config.Require("subscriptionId");

    // Analogous to the ARM template's "variables" section.
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
    // UNCOMMENT when VM decalrations are added
    //var vmStorageAccountType ="Premium_LRS";

    // Centralized Id creation as seen scattered around the ARM template.
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
    var bastionSubnet = new Subnet(bastionSubnetName, new ()
    {
        SubnetName = bastionSubnetName,
        ResourceGroupName = resourceGroup.Name,
        VirtualNetworkName = vNet.Name,
        AddressPrefix = vNetBastionSubnetAddressPrefix
    });
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

    // Network Interfaces
    // TODO: Add VM declarations
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
});