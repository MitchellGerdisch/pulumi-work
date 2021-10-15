using Pulumi;
using Pulumi.Azure.Core;
using Pulumi.Azure.Storage;

class MyStack : Stack
{
    public MyStack()
    {
        var config = new Pulumi.Config();
        var rgName = config.RequireSecret("rgName"); 
        
        // Variations on the theme
        
        // Nicest answer
        var rg = new ResourceGroup("my-rg", new ResourceGroupArgs
        {
            Name = Output.Format($"{rgName}"),
        });
    
        // Using Output.Tuple approach with a dummy variable, goo
        //var rg = new ResourceGroup("my-rg", new ResourceGroupArgs
        // {
        //  Name = Output.Tuple<string, string>(rgName, goo).Apply(t =>
        //  {
        //     (string rgn, string g) = t;
        //     return $"{rgn}";
        //  }),
        //});

        // Resource creation in the Apply()
        //var resourceGroupName = rgName.Apply(rgn => {
        //    var rg = new ResourceGroup(rgn, new ResourceGroupArgs
        //    {
        //        Name = rgn,
        //    });
        //    return rg.Name;
        //});

        var storageAccount = new Account("storage", new AccountArgs
        {
            ResourceGroupName = resourceGroupName,
            AccountReplicationType = "LRS",
            AccountTier = "Standard"
        });

        this.ResourceGroupName = resourceGroupName;
        this.ConnectionString = storageAccount.PrimaryConnectionString;

    }
    [Output] 
    public Output<string> ResourceGroupName { get; set; }
    [Output]
    public Output<string> ConnectionString { get; set; }
}
