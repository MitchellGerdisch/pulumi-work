import pulumi
import pulumi_azure_native as azure_native
from pulumi_azure_native import resources, databricks, authorization
import pulumi_databricks as pdb

config = pulumi.Config()
base_name = config.get("base_name") or "mitch"

# Create a new Azure resource group for our workspace
resource_group = resources.ResourceGroup(f"{base_name}-rg")

# Create the Azure Databricks workspace
azure_info = authorization.get_client_config()

managed_resource_group_id = f"/subscriptions/{azure_info.subscription_id}/resourceGroups/{base_name}-managed-rg"

workspace = databricks.Workspace(
    f"{base_name}-databricks-wksp",
    location=resource_group.location,
    sku=databricks.SkuArgs(name='standard'),
    managed_resource_group_id=managed_resource_group_id,
    resource_group_name=resource_group.name,
)

# Export relevant URIs and IDs as outputs
pulumi.export('managed_resource_group_id', workspace.managed_resource_group_id)
pulumi.export('workspace_name', workspace.name)
pulumi.export('workspace_url', workspace.workspace_url)
pulumi.export('workspace_link', pulumi.Output.concat("https://",workspace.workspace_url))
