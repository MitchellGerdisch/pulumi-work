// arm2pulumi of https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/201-cdn-with-ruleseengine-rewriteandredirect/azuredeploy.json
// Changes made to arm2pulumi output:
// - (arm2pulumi Issue) changed odataType to odataType. 
// - (arm2pulumi Issue) order property value is being set to a string (e.g. "1") and it should be a number (e.g. 1).
// - (arm2pulumi Issue) added profileName property to the endpoint declaration that references the CDN profile that is in the generated pulumi code.
// - (arm2pulumi Issue) the generated pulumi code creates the endpoint name as profilename/endpointname and this appears to mess up Azure. So changed to just use endpoingNameParam
// - changed inputs from using configs to use locally declared constants to make it more portable. This was just personal preference.
// - added a declaration of a resource group to have one for provisioning the endpoint, etc instead of using a preexisting resource group as the ARM template assumes.
// - changed references to things like resource group name and location constants to use properties of the created resource group.

import * as pulumi from "@pulumi/pulumi";
import * as azure_nextgen from "@pulumi/azure-nextgen";

const cDNSkuParam = "Standard_Microsoft";
const endpointNameParam = "mitch-endpoint"
const resourceGroupNameParam = "mitch-rg"
const originUrlParam = "www.mitch.com"
const profileNameParam = "mitch-profile"
const locationParam = "centralus"

const resourceGroup = new azure_nextgen.resources.latest.ResourceGroup('resourceGroup', {
    resourceGroupName: resourceGroupNameParam,
    location: locationParam
  });

const profileResource = new azure_nextgen.cdn.v20190415.Profile("profileResource", {
    location: resourceGroup.location, //MRG use resource group properties
    profileName: profileNameParam,
    resourceGroupName: resourceGroup.name, //MRG use resource group properties
    sku: {
        name: cDNSkuParam,
    },
});

const endpointResource = new azure_nextgen.cdn.v20190415.Endpoint("endpointResource", {
    profileName: profileResource.name, // MRG added missing property
    contentTypesToCompress: [
        "text/plain",
        "text/html",
        "text/css",
        "application/x-javascript",
        "text/javascript",
    ],
    deliveryPolicy: {
        description: "Rewrite and Redirect",
        rules: [
            {
                actions: [{
                    name: "UrlRewrite",
                    parameters: {
                        odataType: "#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlRewriteActionParameters",
                        destination: "/mobile",
                        sourcePattern: "/standard",
                    },
                }],
                conditions: [{
                    name: "IsDevice",
                    parameters: {
                        odataType: "#Microsoft.Azure.Cdn.Models.DeliveryRuleIsDeviceConditionParameters",
                        matchValues: ["Mobile"],
                        operator: "Equal",
                    },
                }],
                name: "PathRewriteBasedOnDeviceMatchCondition",
                order: 1,
            },
            {
                actions: [{
                    name: "UrlRedirect",
                    parameters: {
                        odataType: "#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlRedirectActionParameters",
                        destinationProtocol: "Https",
                        redirectType: "Found",
                    },
                }],
                conditions: [{
                    name: "RequestScheme",
                    parameters: {
                        odataType: "#Microsoft.Azure.Cdn.Models.DeliveryRuleRequestSchemeConditionParameters",
                        matchValues: ["HTTP"],
                        operator: "Equal",
                    },
                }],
                name: "HttpVersionBasedRedirect",
                order: 2,
            },
        ],
    },
    //MRG changed to simple name instead of: endpointName: `${profileNameParam}/${endpointNameParam}`,
    endpointName: endpointNameParam,
    isCompressionEnabled: true,
    isHttpAllowed: true,
    isHttpsAllowed: true,
    location: resourceGroup.location, // MRG used resourceGroup property
    originHostHeader: originUrlParam,
    origins: [{
        hostName: originUrlParam,
        name: "origin1",
    }],
    queryStringCachingBehavior: "IgnoreQueryString",
    resourceGroupName: resourceGroup.name, // MRG used resourceGroup property
});



