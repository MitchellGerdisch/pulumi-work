import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";

const config = new pulumi.Config()
const baseName = config.get("baseName") || "pulumihook"
const slackWebhookUrl = config.requireSecret("slackWebhookUrl")

// Create a resource group 
// const resourceGroup = new azure.core.ResourceGroup(`${baseName}-rg`, {location: 'Central US'});
const resourceGroup = new azure.core.ResourceGroup("resourcegroup")
export const rgName = resourceGroup.name

// Magic function to create all the stuff needed to create a webhook
const greeting = new azure.appservice.HttpEventSubscription('greeting', {
  resourceGroup,
  callback: async (context, req) => {
      return {
          status: 200,
          body: `Hello ${req.query['name'] || 'World'}!`
      };
  }
});

export const url = greeting.url;

