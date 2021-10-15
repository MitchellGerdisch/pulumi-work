import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi"
import * as storage from "@pulumi/azure/storage";
import * as cdn from "@pulumi/azure-nextgen/cdn/latest";

// These are the input properties supported by the custom resource.
// Can be anything that makes sense. Supporting location and tags in this example.
// - resourceGroupName: resource group in which to launch these resources
// - location: location for these resources. 
interface FeEndpointArgs{
    resourceGroupName: Input<string>;
    location: Input<string>;
    cdnProfileName: Input<string>;
    wafRulesId: Input<string>;
    originsHostHeader: Input<string>;
    origins: { name: string, hostName: Input<string> }[]; 
};

export class FeEndpoint extends pulumi.ComponentResource {
    // The output properties for the custom resource.
    // Can be anything that makes sense. 
    // In this case, the endpoint URL is returned.
    public readonly url: Output<string>;
    //private readonly sa: storage.Account;

    // Standard constructor declaration 
    // - name: this is standard resource declaration name. In the case of this custom resource, it is also used as a basis for the resource names.
    // - args: the input properties for the custom resource as declared in the Interface above.
    // - opts: supports standard Pulumi resource options (e.g. the protect flag or the dependsOn flag).
    constructor(name: string, args: FeEndpointArgs, opts?: pulumi.ComponentResourceOptions) {
        // MUST HAVE this super() call to register the custom resource.
        // You'll see this string in the pulumi up
        super("custom:x:FeEndpoint", name, args, opts);

        const resourceGroupName = args.resourceGroupName
        const location = args.location
        const cdnProfileName = args.cdnProfileName
        const wafRulesId = args.wafRulesId
        const originsHostHeader = args.originsHostHeader
        const origins = args.origins
        //const originsName = args.originsName
        //const originsHostName = args.originsHostName

        // Endpoint
        const endpoint = new cdn.Endpoint(`${name}-endpoint`, {
            resourceGroupName: args.resourceGroupName,
            location: location,
            profileName: cdnProfileName,
            webApplicationFirewallPolicyLink: { id: wafRulesId},
            endpointName: `${name}-endpoint`,
            isHttpAllowed: false,
            isHttpsAllowed: true,
            originHostHeader: originsHostHeader,
            origins: origins, 
            contentTypesToCompress: ['text/html', 'application/octet-stream'],
            deliveryPolicy: {
                rules: [
                    {
                        actions: [
                            {
                                name: "ModifyResponseHeader",
                                parameters: {
                                    odataType:  "#Microsoft.Azure.Cdn.Models.DeliveryRuleHeaderActionParameters",
                                    headerAction: "Append",
                                    headerName: "X-Frame-Options",
                                    value: "DENY",
                                },
                            },
                            {
                                name: "ModifyResponseHeader",
                                parameters: {
                                    odataType:  "#Microsoft.Azure.Cdn.Models.DeliveryRuleHeaderActionParameters",
                                    headerAction: "Append",
                                    headerName: "cache-control",
                                    value: "no-store",
                                },
                            },
                            {
                                name: "ModifyResponseHeader",
                                parameters: {
                                    odataType:  "#Microsoft.Azure.Cdn.Models.DeliveryRuleHeaderActionParameters",
                                    headerAction: "Append",
                                    headerName: "Content-Security-Policy",
                                    value: "frame-ancestors 'none'",
                                },
                            },
                        ],
                        conditions: [],
                        name: "Global",
                        order: 0,
                    },
                    {
                        actions: [{
                            name: "UrlRewrite",
                            parameters: {
                                odataType:  "#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlRewriteActionParameters",
                                destination: "/index.html",
                                preserveUnmatchedPath: false,
                                sourcePattern: "/",
                            },
                        }],
                        conditions: [{
                            name: "UrlFileExtension",
                            parameters: {
                                odataType:  "#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlFileExtensionMatchConditionParameters",
                                matchValues: ["0"],
                                negateCondition: false,
                                operator: "LessThanOrEqual",
                            },
                        }],
                        name: "ToIndex",
                        order: 1,
                    },
                    {
                        actions: [
                            {
                                name: "CacheExpiration",
                                parameters: {
                                    odataType:  "#Microsoft.Azure.Cdn.Models.DeliveryRuleCacheExpirationActionParameters",
                                    cacheBehavior: "BypassCache",
                                    cacheType: "All",
                                },
                            },
                            {
                                name: "ModifyResponseHeader",
                                parameters: {
                                    odataType:  "#Microsoft.Azure.Cdn.Models.DeliveryRuleHeaderActionParameters",
                                    headerAction: "Overwrite",
                                    headerName: "Strict-Transport-Security",
                                    value: "max-age=31536000; includeSubDomains; preload",
                                },
                            },
                            {
                                name: "ModifyResponseHeader",
                                parameters: {
                                    odataType:  "#Microsoft.Azure.Cdn.Models.DeliveryRuleHeaderActionParameters",
                                    headerAction: "Overwrite",
                                    headerName: "X-XSS-Protection",
                                    value: "�1; mode=block�",
                                },
                            },
                        ],
                        conditions: [{
                            name: "UrlPath",
                            parameters: {
                                odataType:  "#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlPathMatchConditionParameters",
                                negateCondition: false,
                                operator: "Any",
                            },
                        }],
                        name: "bypasscache",
                        order: 2,
                    },
                    {
                        actions: [{
                            name: "UrlRedirect",
                            parameters: {
                                odataType:  "#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlRedirectActionParameters",
                                destinationProtocol: "Https",
                                redirectType: "Found",
                            },
                        }],
                        conditions: [{
                            name: "RequestScheme",
                            parameters: {
                                odataType:  "#Microsoft.Azure.Cdn.Models.DeliveryRuleRequestSchemeConditionParameters",
                                matchValues: ["HTTP"],
                                negateCondition: false,
                                operator: "Equal",
                            },
                        }],
                        name: "EnforceHTTPS",
                        order: 3,
                    },
                    {
                        actions: [{
                            name: "ModifyResponseHeader",
                            parameters: {
                                odataType:  "#Microsoft.Azure.Cdn.Models.DeliveryRuleHeaderActionParameters",
                                headerAction: "Overwrite",
                                headerName: "X-Content-Type-Options",
                                value: "nosniff",
                            },
                        }],
                        conditions: [{
                            name: "RequestScheme",
                            parameters: {
                                odataType:  "#Microsoft.Azure.Cdn.Models.DeliveryRuleRequestSchemeConditionParameters",
                                matchValues: ["HTTPS"],
                                negateCondition: false,
                                operator: "Equal",
                            },
                        }],
                        name: "HeaderModifications",
                        order: 4,
                    },
                ],
            }
        }, {parent: this });

        // This tells pulumi that resource creation is complete and so will register with the stack
        this.registerOutputs({});

        this.url= pulumi.interpolate`https://${endpoint.hostName}/`;

    }
}
