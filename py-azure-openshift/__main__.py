"""
For next time
- use pulumi.ai to generate the cluster code to show what we started with
    - We've done some work since then
- Current error on pulumi up and go from there
    - use ai to get the network and subnet stuff
    - Keep going ...
"""

import pulumi
from pulumi_azure_native import network
from pulumi_azure_native import redhatopenshift as openshift
from pulumi_azure_native import resources
from pulumi_azure_native import authorization
import pulumi_azure_native as azure_native
import pulumi_azuread as azuread

# TODO: Pull the base_name from stack config
# Also add stack config for things like node count and size, etc. Basically make this thing more general purpose.
base_name = "mitch"

# Create an Azure Resource Group
# rg_name = f"{base_name}-rg"
resource_group = resources.ResourceGroup(f"{base_name}-rg")

# create a rg for the cluster
cluster_resource_group = resources.ResourceGroup(f"{base_name}-cluster-rg")


virtual_network = network.VirtualNetwork(f"{base_name}-vnet",
    resource_group_name=resource_group.name,
    address_space={
        'addressPrefixes': ['10.0.0.0/16'],
    })

# Create a Subnet
subnet = network.Subnet(f"{base_name}-subnet",
    resource_group_name=resource_group.name,
    virtual_network_name=virtual_network.name,
    address_prefix='10.0.1.0/24')

subnet_worker = network.Subnet(f"{base_name}-subnet-worker",
    resource_group_name=resource_group.name,
    virtual_network_name=virtual_network.name,
    address_prefix='10.0.2.0/24')

ad_app_name = f"{base_name}-aks-app"
current = azuread.get_client_config()
ad_app = azuread.Application(ad_app_name,
    display_name=ad_app_name,
    owners=[current.object_id],
)

ad_sp = azuread.ServicePrincipal(f"{base_name}-aks-sp",
    application_id=ad_app.application_id,
    # app_role_assignment_required=False,
    owners=[current.object_id],
)

ad_sp_password = azuread.ServicePrincipalPassword(f"{base_name}-aks-sp-pwd",
    service_principal_id=ad_sp.id,
    end_date='2099-01-01T00:00:00Z',
)

# Use the built-in "Network Contributor" role
# TO-DO: This seems kinda weird. Probably should create the role.
NETWORK_CONTRIBUTOR = "4d97b98b-1d4f-4787-a291-c67834d212e7"
# Define the role assignment
azure_info = authorization.get_client_config()
role_assignment = authorization.RoleAssignment(f"{base_name}-aks-sp-pwd",
    principal_id=ad_sp.id,
    principal_type="ServicePrincipal",
    role_definition_id=f"/subscriptions/{azure_info.subscription_id}/providers/Microsoft.Authorization/Definitions/{NETWORK_CONTRIBUTOR}",
    scope=virtual_network.id
)
# # Openshift cluster
# os_cluster = openshift.OpenShiftCluster(f"{base_name}-openshift", openshift.OpenShiftClusterArgs(
#     resource_group_name=resource_group.name,
#     apiserver_profile=azure_native.redhatopenshift.APIServerProfileArgs(
#         visibility="Public",
#     ),
#     cluster_profile=openshift.ClusterProfileArgs(
#         domain=f"{base_name}-something.com",
#         resource_group_id=cluster_resource_group.id,
#         fips_validated_modules="Enabled",
#     ),
#     service_principal_profile=openshift.ServicePrincipalProfileArgs(
#         client_id=ad_sp.application_id,
#         client_secret=ad_sp_password.value
#     ),
#     worker_profiles=[azure_native.redhatopenshift.WorkerProfileArgs(
#         count=2,
#         disk_size_gb=128,
#         name="worker",
#         subnet_id=subnet_worker.id,
#         vm_size="Standard_D4s_v3",
#         encryption_at_host=azure_native.redhatopenshift.EncryptionAtHost.ENABLED
#     )],
#     console_profile=azure_native.redhatopenshift.ConsoleProfileArgs(),
#     ingress_profiles=[azure_native.redhatopenshift.IngressProfileArgs(
#         name="default",
#         visibility="Public",
#     )],
#     master_profile=azure_native.redhatopenshift.MasterProfileArgs(
#         encryption_at_host="Enabled",
#         subnet_id=subnet.id,
#         vm_size="Standard_D8s_v3",
#     ),
#     network_profile=azure_native.redhatopenshift.NetworkProfileArgs(
#         pod_cidr="10.128.0.0/14",
#         service_cidr="172.30.0.0/16",
#     ),
# ), opts=pulumi.ResourceOptions(depends_on=[role_assignment]) )

