import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "storage-infra-pkg";

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup("mitch-rg");

const sa = new storage.StorageInfra("mitch-storage", {
    resourceGroupName: resourceGroup.name
})

export const saKey = sa.storageKey
