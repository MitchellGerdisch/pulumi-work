"""
For next time
- use pulumi.ai to generate the cluster code to show what we started with
    - We've done some work since then
- Current error on pulumi up and go from there
    - use ai to get the network and subnet stuff
    - Keep going ...
"""

import pulumi
from pulumi_azure_native import redhatopenshift as openshift
from pulumi_azure_native import resources
import pulumi_azure_native as azure_native
import pulumi_command as cmd
import pulumi_azuread as azuread
from pulumi_azure_native import network

base_name = "mitch"
name = "mitch"

# Create an Azure Resource Group
resource_group = resources.ResourceGroup(f"{base_name}-rg")

# create a rg for the cluster
cluster_resource_group = resources.ResourceGroup(f"{base_name}-cluster-rg")

ad_app_name = f"{name}-aks-app"
current = azuread.get_client_config()
ad_app = azuread.Application(ad_app_name,
    display_name=ad_app_name,
    owners=[current.object_id],
)

ad_sp = azuread.ServicePrincipal(f"{name}-aks-sp",
    application_id=ad_app.application_id,
    app_role_assignment_required=False,
    owners=[current.object_id],
)

ad_sp_password = azuread.ServicePrincipalPassword(f"{name}-aks-sp-pwd",
    service_principal_id=ad_sp.id,
    end_date='2099-01-01T00:00:00Z',
)


# Openshift cluster
os_cluster = openshift.OpenShiftCluster(f"{base_name}-openshift", openshift.OpenShiftClusterArgs(
    resource_group_name=resource_group.name,
    apiserver_profile=azure_native.redhatopenshift.APIServerProfileArgs(
        visibility="Public",
    ),
    cluster_profile=openshift.ClusterProfileArgs(
        domain=f"{base_name}-something.com",
        resource_group_id=cluster_resource_group.id,
        fips_validated_modules="Enabled",
    ),
    service_principal_profile=openshift.ServicePrincipalProfileArgs(
        client_id=ad_sp.application_id,
        client_secret=ad_sp_password.value
    ),
    worker_profiles=[azure_native.redhatopenshift.WorkerProfileArgs(
        count=3,
        disk_size_gb=128,
        name="worker",
        subnet_id="/subscriptions/mySubscription/resourceGroups/myResourceGroup/providers/Microsoft.Network/virtualNetworks/myVnet/subnets/mySubnet",
        vm_size="Standard_D2s_v3",
    )],
    console_profile=azure_native.redhatopenshift.ConsoleProfileArgs(),
    ingress_profiles=[azure_native.redhatopenshift.IngressProfileArgs(
        name="default",
        visibility="Public",
    )],
    master_profile=azure_native.redhatopenshift.MasterProfileArgs(
        encryption_at_host="Enabled",
        subnet_id="/subscriptions/mySubscription/resourceGroups/myResourceGroup/providers/Microsoft.Network/virtualNetworks/myVnet/subnets/mySubnet",
        vm_size="Standard_D8s_v3",
    ),
    network_profile=azure_native.redhatopenshift.NetworkProfileArgs(
        pod_cidr="10.128.0.0/14",
        service_cidr="172.30.0.0/16",
    ),
))


# import pulumi
# import pulumi_azure_native as azure_native

# open_shift_cluster = azure_native.redhatopenshift.OpenShiftCluster("openShiftCluster",

#     cluster_profile=azure_native.redhatopenshift.ClusterProfileArgs(
#         domain="cluster.location.aroapp.io",
#         fips_validated_modules="Enabled",
#         pull_secret="{\"auths\":{\"registry.connect.redhat.com\":{\"auth\":\"\"},\"registry.redhat.io\":{\"auth\":\"\"}}}",
#         resource_group_id="/subscriptions/subscriptionId/resourceGroups/clusterResourceGroup",
#     ),
    
#     resource_group_name="resourceGroup",
#     resource_name_="resourceName",
#     service_principal_profile=azure_native.redhatopenshift.ServicePrincipalProfileArgs(
#         client_id="clientId",
#         client_secret="clientSecret",
#     ),
# )
