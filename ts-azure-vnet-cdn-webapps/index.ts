import * as pulumi from "@pulumi/pulumi";
import { BaseNet } from "./base-net";
import { FrontEnd } from "./front-end";
import { BackEnd } from "./back-end";
import { SharedElements } from "./shared-elements";


//// Use config to store a base name for resources 
//// Added nameBase to the vault and storage account to avoid global naming conflicts.
//// This is also used for the custom resource.
const config = new pulumi.Config();
const nameBase = config.get("nameBase") || "mitchhrd"
const tenantId = config.requireSecret("tenantId") 
// Info on how to find vault object ID value: https://docs.microsoft.com/en-us/azure/key-vault/general/assign-access-policy-cli#acquire-the-object-id
const vaultObjectId = config.requireSecret("vaultObjectId")

const vnetCidr = "10.4.1.0/24"
const spaCidr = "10.4.1.0/27"
const beCidr = "10.4.1.32/27" 
const crmCidr =  "10.4.1.64/27"

//// Create the base networking environment that is used as a foundation for the other resources.
const baseNet = new BaseNet(nameBase, {
    location: "uksouth",
    vnetCidr: vnetCidr,
    spaCidr: spaCidr,
    beCidr: beCidr, 
    crmCidr: crmCidr,
});
const resourceGroup = baseNet.resourceGroup

const sharedElements = new SharedElements(nameBase, {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location, 
    tenantId: tenantId,
    vaultObjectId: vaultObjectId,
})

// Create the frontend components:
const frontEnd = new FrontEnd(nameBase, {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
})

// Create the backend API components
const beapi = new BackEnd(`${nameBase}-be`, {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    allowedAccess: spaCidr,
    appInsightsKey: sharedElements.instrumentationKey,
    backupStorageSasUrl: sharedElements.webBackupStorageAccountSasUrl
})

// Create the CRM API components 
const crm = new BackEnd(`${nameBase}-crm`, {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    allowedAccess: beCidr,
    appInsightsKey: sharedElements.instrumentationKey,
    backupStorageSasUrl: sharedElements.webBackupStorageAccountSasUrl,
})




export const feSpaEndpoint = frontEnd.spaUrl
export const feBeapiEndpoint = frontEnd.beapiUrl
export const beApiUrl = beapi.url
export const crmApiUrl = crm.url
