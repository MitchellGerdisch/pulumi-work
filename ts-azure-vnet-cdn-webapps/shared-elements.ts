import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi"
import * as insights from "@pulumi/azure-nextgen/insights/latest";
import * as cache from "@pulumi/azure-nextgen/cache/latest";
import * as storage from "@pulumi/azure-nextgen/storage/latest";
import * as keyvault from "@pulumi/azure-nextgen/keyvault/latest";
import * as storage_classic from "@pulumi/azure/storage"


// These are the input properties supported by the custom resource.
// Can be anything that makes sense. Supporting location and tags in this example.
// - resourceGroupName: resource group in which to launch these resources
// - location: location for these resources. 
interface SharedElementsArgs {
    resourceGroupName: Input<string>;
    location: Input<string>;
    tenantId: Input<string>;
    vaultObjectId: Input<string>;
};

export class SharedElements extends pulumi.ComponentResource {
  // The output properties for the custom resource.
  // Can be anything that makes sense. 
  // In this case, the endpoint URL is returned.
  public readonly instrumentationKey: Output<string>;
  public readonly webBackupStorageAccountSasUrl: Output<string>;
  //private readonly sa: storage.Account;


  // Standard constructor declaration 
  // - name: this is standard resource declaration name. In the case of this custom resource, it is also used as a basis for the resource names.
  // - args: the input properties for the custom resource as declared in the Interface above.
  // - opts: supports standard Pulumi resource options (e.g. the protect flag or the dependsOn flag).
  constructor(name: string, args: SharedElementsArgs, opts?: pulumi.ComponentResourceOptions) {
    // MUST HAVE this super() call to register the custom resource.
    // You'll see this string in the pulumi up
    super("custom:x:SharedElements", name, args, opts);

    const resourceGroupName = args.resourceGroupName
    const location = args.location
    const tenantId = args.tenantId
    const vaultObjectId = args.vaultObjectId

    const beAppInsights = new insights.Component(`${name}-app-insights`, {
        applicationType: "web",
        flowType: "Bluefield",
        kind: "web",
        location: location,
        requestSource: "rest",
        resourceGroupName: resourceGroupName,
        resourceName: `${name}-app-insights`
    }, {parent: this});


    // create the shared redis cache
    //// Azure takes FOREVER AND A DAY to create redis cache. So commenting out to speed up testing/demos for the time being.
    // const redis = new cache.Redis(`${name}-redis`, {
    //   name: `${name}-redis`,
    //   resourceGroupName: resourceGroupName,
    //   location: location,
    //   sku: {
    //       capacity: 1,
    //       family: "C",
    //       name: "Basic",
    //   },
    // }, {parent: this});
    
    // create the shared "stcards" storage account
    const stcards = new storage.StorageAccount(`${name}stcards`, {
      resourceGroupName: resourceGroupName,
      accountName: `${name}stcards`,
      location: location,
      sku: {
          name: "Standard_LRS",
      },
      kind: "StorageV2", 
      /*tags: {
        Environment: "Dev",
        CostCenter: "VSE",
      }*/
    }, {parent:this});

    const stcardsContainer = new storage.BlobContainer(`${name}stcardscont`, {
      resourceGroupName: resourceGroupName,
      accountName: stcards.name,
      containerName: `${name}stcardscont`
    }, {parent: this})

    // Using the classic provider for the webapp backup storage account so we can take advantage of the SAS function available with that provider.
    const webBackups = new storage_classic.Account(`${name}bkup`, {
      resourceGroupName: resourceGroupName,
      location: location,
      accountTier: "Standard",
      accountReplicationType: "LRS",
    }, {parent: this});

    const webBackupsSasInfo = webBackups.primaryConnectionString.apply(primaryConnectionString => storage_classic.getAccountSAS({
      connectionString: primaryConnectionString,
      httpsOnly: true,
      signedVersion: "2019-12-12",
      resourceTypes: {
          service: true,
          container: true,
          object: true,
      },
      services: {
          blob: true,
          queue: false,
          table: false,
          file: false,
      },
      start: "2020-12-01T00:00:00Z", // we could use Typescript functions to get current time and calculate future time.
      expiry: "2030-01-01T00:00:00Z", // but for now we'll just hardcode a long time.
      permissions: {
          read: true,
          write: true,
          delete: true,
          list: true,
          add: true,
          create: true,
          update: true,
          process: true,
      },
    }));

    const webBackupsContainer = new storage.BlobContainer(`${name}webbackupscontainer`, {
      resourceGroupName: resourceGroupName,
      accountName: webBackups.name,
      containerName: `${name}webbackupscontainer`
    }, {parent: this})

    // Build the SAS URI to be passed back for the webapps backup configuration
    const baseUrl = pulumi.interpolate`${webBackups.primaryBlobEndpoint}${webBackupsContainer.name}`
    const sas = webBackupsSasInfo.sas
    // The SAS we created is for the storage account. But, it's being used in conjunction with the container since 
    // the webapp backup properties needs a URL that points at a container and not the whole account.
    // Therefore, we actually need a service SAS and that means we need the "sr" parameter.
    // See: https://docs.microsoft.com/en-us/rest/api/storageservices/create-service-sas#specifying-the-signed-resource-blob-service-only
    const extraParameters = "&sr=c"
    const sasUri = pulumi.interpolate`${baseUrl}${sas}${extraParameters}`

    const vault = new keyvault.Vault(`${name}-vault`, {
      vaultName: `${name}-vault`,
      resourceGroupName: resourceGroupName,
      location: location,
      properties: {
          enableSoftDelete: false,
          accessPolicies: [{
              objectId: vaultObjectId, // Info on how to find this value: https://docs.microsoft.com/en-us/azure/key-vault/general/assign-access-policy-cli#acquire-the-object-id
              permissions: {
                  certificates: [
                      "get",
                      "list",
                      "delete",
                      "create",
                      "import",
                      "update",
                      "managecontacts",
                      "getissuers",
                      "listissuers",
                      "setissuers",
                      "deleteissuers",
                      "manageissuers",
                      "recover",
                      "purge",
                  ],
                  keys: [
                      "encrypt",
                      "decrypt",
                      "wrapKey",
                      "unwrapKey",
                      "sign",
                      "verify",
                      "get",
                      "list",
                      "create",
                      "update",
                      "import",
                      "delete",
                      "backup",
                      "restore",
                      "recover",
                      "purge",
                  ],
                  secrets: [
                      "get",
                      "list",
                      "set",
                      "delete",
                      "backup",
                      "restore",
                      "recover",
                      "purge",
                  ],
              },
              tenantId: tenantId,
          }],
          enabledForDeployment: true,
          enabledForDiskEncryption: true,
          enabledForTemplateDeployment: true,
          sku: {
              family: "A",
              name: "standard",
          },
          tenantId: tenantId,
      },
 
    }, {parent: this});

    this.registerOutputs({});

    this.instrumentationKey = beAppInsights.instrumentationKey 
    this.webBackupStorageAccountSasUrl = sasUri
  }
}
