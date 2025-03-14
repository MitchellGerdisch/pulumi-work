"""
An Pulumi python program that leverages Terraform modules from https://azure.github.io/Azure-Verified-Modules/

pulumi package add terraform-module Azure/avm-res-network-virtualnetwork/azurerm 0.8.1 vnet 
"""

import pulumi
import pulumi_azure as azure
from pulumi_azure import core, storage
import pulumi_vnet as vnet

from netaddr import IPNetwork

config = pulumi.Config()
network_cidr = config.get('network_cidr', '10.0.0.0/24') 
subnet_prefix = config.get_int('subnet_prefix', 26)

# Create an Azure Resource Group
resource_group = core.ResourceGroup('resource_group')

# Create a Virtual Network with multiple subnets using imported terraform module
# Use python netaddr package to generate the subnet addresses and build the subnet list for the vnet resource
network = IPNetwork(network_cidr)
subnet_ips = network.subnet(subnet_prefix)
subnet_cidrs = [str(ip) for ip in subnet_ips]
subnets = {}
for subnet_cidr in subnet_cidrs:
    subnet_name=f"subnet-{subnet_cidr}"
    subnets[subnet_name] = vnet.SubnetsArgs(
        name=subnet_name,
        address_prefix=subnet_cidr
    )

# vnet_provider = vnet.Provider('vnet_provider', 
#     azurerm={"features":azure.ProviderFeaturesArgs(      
#         resource_group=azure.ProviderFeaturesResourceGroupArgs(prevent_deletion_if_contains_resources = False))
#     }
# )

vnet_provider = vnet.Provider('vnet_provider', 
    azurerm={"features": {"resource_group": {"prevent_deletion_if_contains_resources": False}}}
)

vnet = vnet.Module('vnet', vnet.ModuleArgs(
                    resource_group_name=resource_group.name,
                    location=resource_group.location,
                    name='vnet',
                    address_space=['10.0.0.0/16'],
                    subnets=subnets,
                #     peerings={"vnet-peering": vnet.PeeringsArgs(
                #         name='vnet-peering',
                #         remote_virtual_network_resource_id='fakevpc',
                #         allow_virtual_network_access=True,)}
                #    ),
                   opts=pulumi.ResourceOptions(provider=vnet_provider)
)

pulumi.export('resourcegroup_name', resource_group.name)
