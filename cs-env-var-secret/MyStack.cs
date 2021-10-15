using Pulumi;
using Pulumi.Azure.Core;
using Pulumi.Azure.Storage;

class MyStack : Stack
{
  public MyStack()
  {
    var location = Pulumi.Output.CreateSecret(System.Environment.GetEnvironmentVariable("LOCATION") ?? "novalue");
    // Create an Azure Resource Group
    var resourceGroup = new ResourceGroup("resourceGroup", new ResourceGroupArgs
    {
      Location = location
    });

    // Create an Azure Storage Account
    // var storageAccount = new Account("storage", new AccountArgs
    // {
    //   ResourceGroupName = resourceGroup.Name,
    //   AccountReplicationType = "LRS",
    //   AccountTier = "Standard"
    // });

    // Export the connection string for the storage account
    this.resourceGroupLocation = resourceGroup.Location;
  }

  [Output]
  public Output<string> resourceGroupLocation { get; set; }
}
