import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import * as azure_nextgen from "@pulumi/azure-nextgen"

const config = new pulumi.Config()

const nameBase = "mitchcosmo"
// Create an Azure Resource Group
const resourceGroup = new azure.core.ResourceGroup(`${nameBase}-rg`)

export const databaseAccount = new azure_nextgen.documentdb.latest.DatabaseAccount(`${nameBase}-dbacct`, {
    location: resourceGroup.location,
    accountName: `${nameBase}-dbacct`,
    databaseAccountOfferType: "Standard",
    locations: [{
        failoverPriority: 0,
        isZoneRedundant: false,
        locationName: resourceGroup.location
    }],
    resourceGroupName: resourceGroup.name
});

const connectionStrings = pulumi.all([resourceGroup.name, databaseAccount.name]).apply(([rgName, dbName]) => 
    azure_nextgen.documentdb.latest.listDatabaseAccountConnectionStrings({
        resourceGroupName: rgName,
        accountName: dbName,
    }))


const conString = connectionStrings.connectionStrings?.apply(array => {
    let retval
    if (array) {
        retval = array[0].connectionString
    } else {
        retval = "goo"
    }
    return pulumi.secret(retval)
})


const tenantId = config.requireSecret("tenantId")
const vault = new azure_nextgen.keyvault.latest.Vault(`${nameBase}-vault`, {
    vaultName: `${nameBase}-vault`,
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    properties: {
        accessPolicies: [{
            objectId: <OBJECT_ID_FOR_AZURE_USER_ACCOUNT>, // obtained by running: az ad user show --id <email-address-of-user>
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
});


const secret = new azure_nextgen.keyvault.latest.Secret(`${nameBase}-secret`, {
    secretName: `${nameBase}-secret`,
    vaultName: vault.name,
    resourceGroupName: resourceGroup.name,
    properties: {
        value: conString
    }
}) 
