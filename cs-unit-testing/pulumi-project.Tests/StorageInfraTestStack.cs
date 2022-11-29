using Pulumi;
using Pulumi.AzureNative.Insights;
using Pulumi.AzureNative.Resources;
using Pulumi.AzureNative.Sql;
using Pulumi.AzureNative.Storage;
using Pulumi.AzureNative.Web;
using Pulumi.AzureNative.Web.Inputs;

class StorageInfraTestStack: Stack
{
    public StorageInfraTestStack()
    {
        var baseName = "storagecomptest";

        var resourceGroup = new ResourceGroup($"{baseName}-rg");

        var storageInfra = new StorageInfra($"{baseName}", new StorageInfraArgs
        {
            ResourceGroupName = resourceGroup.Name,
        });

    }
}
