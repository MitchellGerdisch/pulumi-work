import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";
import * as web from "@pulumi/azure-native/web";

import { getConnectionString, signedBlobReadUrl } from "./helpers";

const config = new pulumi.Config()
const baseName = config.get("baseName") || "pulumihook"
const slackWebhookUrl = config.requireSecret("slackWebhookUrl")

// Create a separate resource group for this example.
const resourceGroup = new resources.ResourceGroup(`${baseName}-rg`);
export const rgName = resourceGroup.name

// Storage account is required by Function App.
// Also, we will upload the function code to the same storage account.
const storageAccount = new storage.StorageAccount(`${baseName}sa`, {
    resourceGroupName: resourceGroup.name,
    sku: {
        name: storage.SkuName.Standard_LRS,
    },
    kind: storage.Kind.StorageV2,
});

// Function code archives will be stored in this container.
const codeContainer = new storage.BlobContainer("zips", {
    resourceGroupName: resourceGroup.name,
    accountName: storageAccount.name,
});

// Upload Azure Function's code as a zip archive to the storage account.
const codeBlob = new storage.Blob("zip", {
    resourceGroupName: resourceGroup.name,
    accountName: storageAccount.name,
    containerName: codeContainer.name,
    source: new pulumi.asset.FileArchive("./javascript"),
});

// Define a Consumption Plan for the Function App.
// You can change the SKU to Premium or App Service Plan if needed.
const plan = new web.AppServicePlan(`${baseName}-plan`, {
    resourceGroupName: resourceGroup.name,
    sku: {
        name: "Y1",
        tier: "Dynamic",
    },
});

// Build the connection string and zip archive's SAS URL. They will go to Function App's settings.
const storageConnectionString = getConnectionString(resourceGroup.name, storageAccount.name);
const codeBlobUrl = signedBlobReadUrl(codeBlob, codeContainer, storageAccount, resourceGroup);

const app = new web.WebApp(`${baseName}-webhook`, {
    resourceGroupName: resourceGroup.name,
    serverFarmId: plan.id,
    kind: "functionapp",
    siteConfig: {
        appSettings: [
            { name: "AzureWebJobsStorage", value: storageConnectionString},
            { name: "FUNCTIONS_EXTENSION_VERSION", value: "~3" },
            { name: "FUNCTIONS_WORKER_RUNTIME", value: "node" },
            { name: "WEBSITE_NODE_DEFAULT_VERSION", value: "~14" },
            { name: "WEBSITE_RUN_FROM_PACKAGE", value: codeBlobUrl },
            { name: "SLACK_WEBHOOK_URL", value: slackWebhookUrl },
            // This next "environment variable" has no use other than to force Pulumi to do an 
            // update of the webapp when the handler code changes which results in the blob Md5 being updated.
            { name: "FORCE_WEBAPP_UPDATE", value: pulumi.interpolate`${codeBlob.contentMd5}`}, 
        ],
        http20Enabled: true,
        nodeVersion: "~14",
    },
});

// "SlackHandler" part of name must match the name of the folder for the function code.
// So if you change the function code folder, change this URL.
export const webHookURL = pulumi.interpolate`https://${app.defaultHostName}/api/SlackHandler`;
