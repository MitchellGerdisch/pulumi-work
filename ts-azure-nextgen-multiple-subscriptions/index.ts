import * as pulumi from "@pulumi/pulumi";
import * as azure_nextgen from "@pulumi/azure-nextgen";

// get some subscription Ids
const config = new pulumi.Config()
let azureSubs = []
azureSubs[0] = config.require("azureSub1")
azureSubs[1] = config.require("azureSub2")

// Create some subscription-specific providers.
let azProviders = []
for (let s = 0; s < azureSubs.length; s++) {
    azProviders[s] = new azure_nextgen.Provider(`provider${s}`, {
        subscriptionId: azureSubs[s]
    })
}

// Create some resource groups in each subscription to show how all this works. 
let rgIds = []
// To start, let's create a RG in the default subscription.
// This is the subscription specified by the user as per: https://www.pulumi.com/docs/intro/cloud-providers/azure/setup/
const defaultSubRg = new azure_nextgen.resources.latest.ResourceGroup("defaultSubRg", {
    location: "eastus",
    resourceGroupName: "defaultSubRg",
});

rgIds.push(defaultSubRg.id)

// Now let's create an RG in each of the specified subscriptions.

for (let p = 0; p < azProviders.length; p++) {
    const rg = new azure_nextgen.resources.latest.ResourceGroup(`providerSubRg-${p}`, {
        location: "eastus",
        resourceGroupName: `providerSubRg-${p}`
    }, {provider: azProviders[p]}); 

    rgIds.push(rg.id)
}

export {rgIds}
