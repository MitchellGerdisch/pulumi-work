import * as pulumi from "@pulumi/pulumi";
import * as storage from "@pulumi/azure-native/storage";

// Get information about this stack
const thisStack = pulumi.getStack()

// Get information from base stack
const config = new pulumi.Config()
const baseStackName = config.require("baseStackName")
const baseStack = new pulumi.StackReference(baseStackName)
const resourceGroupName = baseStack.getOutput("resourceGroupName")
const storageAccountName = baseStack.getOutput("storageAccountName")

// Make a static website served from the storage account created by the base stack
// Enable static website support
const staticWebsite = new storage.StorageAccountStaticWebsite("staticWebsite", {
    accountName: storageAccountName,
    resourceGroupName: resourceGroupName,
    indexDocument: "index.html",
    error404Document: "error404.html"
});

// Loop through and create the applicable storage blobs.
// We're using "in-line" source code, but it could just as easily be pulled in from source code files.
for (var file of ["index", "404"]) {
    new storage.Blob(`${file}.html`, {
        resourceGroupName: resourceGroupName,
        accountName: storageAccountName,
        containerName: staticWebsite.containerName,
        source: new pulumi.asset.StringAsset(`
            <html>
            <body>
                <h1>This ${file} page is served by stack ${thisStack} courtesy of Pulumi!</h1>
            </body>
            </html>
            `),
        contentType: "text/html",
    })
}

// Get the URL for the static website
const storageAccount = pulumi.all([resourceGroupName, storageAccountName])
    .apply(([rgName, saName]) => 
        storage.getStorageAccount({
            resourceGroupName: rgName,
            accountName: saName,
        }))
export const staticEndpoint = storageAccount.primaryEndpoints.web
