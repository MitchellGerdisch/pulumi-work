import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi";
import * as web from "@pulumi/azure-nextgen/web/latest";
import * as appservice from "@pulumi/azure/appservice";

// These are the input properties supported by the custom resource.
// Can be anything that makes sense. Supporting location and tags in this example.
// - resourceGroupName: resource group in which to launch these resources
// - location: location for these resources. 
interface BackEndArgs {
    resourceGroupName: Input<string>;
    location: Input<string>;
    allowedAccess: Input<string>;
    appInsightsKey: Input<string>;
    backupStorageSasUrl: Input<string>;
};

export class BackEnd extends pulumi.ComponentResource {
    // The output properties for the custom resource.
    // Can be anything that makes sense. 
    // In this case, the endpoint URL is returned.
    public readonly url: Output<string>;
    //private readonly sa: storage.Account;


    // Standard constructor declaration 
    // - name: this is standard resource declaration name. In the case of this custom resource, it is also used as a basis for the resource names.
    // - args: the input properties for the custom resource as declared in the Interface above.
    // - opts: supports standard Pulumi resource options (e.g. the protect flag or the dependsOn flag).
    constructor(name: string, args: BackEndArgs, opts?: pulumi.ComponentResourceOptions) {
        // MUST HAVE this super() call to register the custom resource.
        // You'll see this string in the pulumi up
        super("custom:x:BackEnd", name, args, opts);

        const resourceGroupName = args.resourceGroupName
        const location = args.location
        const appInsightsKey = args.appInsightsKey
        const backupStorageSasUrl = args.backupStorageSasUrl

        const beAppServicePlan = new web.AppServicePlan(`${name}-api-svcplan`, {
            resourceGroupName: resourceGroupName,
            location: location,
            name: `${name}-api-svcplan`,
            kind: "app",
            sku: {
                capacity: 1,
                family: "S",
                name: "S1",
                size: "S1",
                tier: "Standard"
            }
        }, {parent: this})

        const beWebApp = new appservice.AppService(`${name}-api-webapp`, {
            location: location,
            resourceGroupName: resourceGroupName,
            appServicePlanId: beAppServicePlan.id,
            enabled: true,
            backup: {
                name: `${name}-api-bkup`,
                enabled: true,
                schedule: {
                    frequencyInterval: 7,
                    frequencyUnit: "Day"
                },
                storageAccountUrl: backupStorageSasUrl
            },
            appSettings: {
                    "APPINSIGHTS_INSTRUMENTATIONKEY": appInsightsKey,
            },
            siteConfig: {
                ipRestrictions: [
                    // Allow from frontend subnet
                    { 
                        ipAddress: args.allowedAccess,
                        action: "Allow",
                        priority: 100,
                        name: "inboundFromFrontEnd",
                    },
                    {
                        ipAddress: "0.0.0.0/0",
                        action: "Deny",
                        priority: 2147483647,
                        name: "Deny all",
                    }
                ],
            },
        }, {parent: this});
        //// Nextgen example - but currently doesn't support setting scheduled backup
        // const beWebApp = new web.WebApp(`${name}-api-webapp`, {
        //     resourceGroupName: resourceGroupName,
        //     location: location,
        //     serverFarmId: beAppServicePlan.id,
        //     name: `${name}-api-webapp`,
        //     enabled: true,
        //     siteConfig: {
        //         appSettings: [
        //             {
        //                 name: "APPINSIGHTS_INSTRUMENTATIONKEY",
        //                 value: appInsightsKey
        //             }
        //         ],
        //         ipSecurityRestrictions: [
        //             // Allow from frontend subnet
        //             { 
        //                 ipAddress: args.allowedAccess,
        //                 action: "Allow",
        //                 tag: "Default",
        //                 priority: 100,
        //                 name: "inboundFromFrontEnd"
        //             },
        //             {
        //                 ipAddress: "Any",
        //                 action: "Deny",
        //                 priority: 2147483647,
        //                 name: "Deny all",
        //                 description: "Deny all access"
        //             }
        //         ],
        // }
        //     //     cors: {
        //     //         allowedOrigins: [
        //     //                  "https://pulumitask.example.com",
        //     //                 "https://stspapulumi001.z33.web.core.windows.net/",
                            
        //     //         ]},
        // }, {parent: this});



        // This tells pulumi that resource creation is complete and so will register with the stack
        this.registerOutputs({});

        ///// if using nextgen provider: this.url = pulumi.interpolate`https://${beWebApp.defaultHostName}/`;
        this.url = pulumi.interpolate`https://${beWebApp.defaultSiteHostname}/`;
    }
}
