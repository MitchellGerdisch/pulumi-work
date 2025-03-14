"""
An Pulumi python program that leverages Terraform modules from https://azure.github.io/Azure-Verified-Modules/
"""

import pulumi
import pulumi_azure as azure
import pulumi_aks as aks


# Create an Azure Resource Group
resource_group = azure.core.ResourceGroup('resource_group')

aks = aks.Module("aks", aks.ModuleArgs(
    resource_group_name=resource_group.name,
    cluster_name="aks-cluster",
))
    # location=resource_group.location,
    # node_count=3,
    # node_size="Standard_B2s",
    # node_zones=["1", "2", "3"],
    # network_plugin="azure",
    # network_policy="calico",
    # service_cidr="  )


pulumi.export('resourcegroup_name', resource_group.name)
