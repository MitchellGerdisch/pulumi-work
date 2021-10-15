import * as pulumi from "@pulumi/pulumi";
import * as azure_nextgen from "@pulumi/azure-nextgen";
import * as azure from "@pulumi/azure"; // added to support file upload and other static website features not in ARM and therefore not in nextgen
import { Output } from "@pulumi/pulumi";
import { URL } from "url";

export interface StaticWebsiteArgs {
  customDomain: string;
  location: string;
  storageSku: string;
  cdnSku: string;
}

export class StaticWebsite extends pulumi.ComponentResource {
  readonly resourceGroup: azure_nextgen.resources.latest.ResourceGroup;
  readonly storageAccount: azure.storage.Account; //azure_nextgen.storage.latest.StorageAccount;
  readonly cdnProfile: azure_nextgen.cdn.latest.Profile;
  readonly cdnEndpoint: azure_nextgen.cdn.latest.Endpoint;
  //readonly cdnCustomDomain: azure_nextgen.cdn.latest.CustomDomain;
  readonly primaryWebEndpoint: Output<string>;
  readonly cdnEndpointUrl: Output<string>;

  constructor(
    name: string,
    args: StaticWebsiteArgs,
    opts?: pulumi.ResourceOptions
  ) {
    super("static-website", name, opts);

    this.resourceGroup = new azure_nextgen.resources.latest.ResourceGroup(
      name,
      {
        resourceGroupName: name,
        location: args.location,
      }
    );

    // USE the classic azure provider for the storageaccount creation and website file upload
    // since ARM and thus nextgen does not support configuring a storageaccount at a static website.
    // this.storageAccount = new azure_nextgen.storage.latest.StorageAccount(
    //   name,
    //   {
    //     accountName: name,
    //     resourceGroupName: this.resourceGroup.name,
    //     kind: "StorageV2",
    //     location: this.resourceGroup.location,
    //     sku: {
    //       name: args.storageSku,
    //     },
    //   }
    // );

    // Create an object of the web page files for easy referencing below
    const webPages  = {
      index: "index.html",
      error: "404.html"
    }

     this.storageAccount = new azure.storage.Account(name, {
      resourceGroupName: this.resourceGroup.name,
      accountReplicationType: "LRS",
      accountTier: "Standard",
      accountKind: "StorageV2",
      staticWebsite: {
          indexDocument: webPages["index"],
          error404Document: webPages["error"],
      },
    });

    //Upload the files for the static website
    //["index.html", "404.html"].map(name =>
    Object.values(webPages).map(name =>
      new azure.storage.Blob(name, {
          name,
          storageAccountName: this.storageAccount.name,
          storageContainerName: "$web",
          type: "Block",
          source: new pulumi.asset.FileAsset(`./wwwroot/${name}`),
          contentType: "text/html",
      }),
    );

    this.cdnProfile = new azure_nextgen.cdn.latest.Profile(name, {
      profileName: name,
      resourceGroupName: this.resourceGroup.name,
      location: this.resourceGroup.location,
      sku: {
        name: args.cdnSku,
      },
    });

    // using classic provider output which is a little different than the ARM/nextgen outptu
    //this.primaryWebEndpoint = this.storageAccount.primaryEndpoints.web.apply(
    this.primaryWebEndpoint = this.storageAccount.primaryWebEndpoint.apply(
       (w) => new URL(w).host
     );

    this.cdnEndpoint = new azure_nextgen.cdn.latest.Endpoint(name, {
      endpointName: name, // CDN endpoint {name}.azureedge.net
      isCompressionEnabled: true,
      isHttpAllowed: true,
      isHttpsAllowed: true,
      location: this.resourceGroup.location,
      resourceGroupName: this.resourceGroup.name,
      profileName: this.cdnProfile.name,
      originHostHeader: this.primaryWebEndpoint,
      contentTypesToCompress: [
        "text/plain",
        "text/html",
        "text/css",
        "text/javascript",
        "application/x-javascript",
        "application/javascript",
        "application/json",
        "application/xml",
        "image/png",
        "image/jpeg",
      ],
      origins: [
        {
          enabled: true,
          name: "cdn-origin",
          hostName: this.primaryWebEndpoint,
          httpsPort: 443,
          httpPort: 80,
        },
      ],
    });

    // CDN endpoint to the website.
    // Allow it some time after the deployment to get ready.
    this.cdnEndpointUrl = pulumi.interpolate`https://${this.cdnEndpoint.hostName}`;

    // DON'T HAVE A DOMAIN TO USE FOR THIS, SO JUST USING THE AZURE-PROVIDED ENDPOINT
    // // Custom domain
    // this.cdnCustomDomain = new azure_nextgen.cdn.latest.CustomDomain(name, {
    //   customDomainName: args.customDomain.split(".").join("-dot-"),
    //   endpointName: this.cdnEndpoint.name,
    //   hostName: args.customDomain,
    //   profileName: this.cdnProfile.name,
    //   resourceGroupName: this.resourceGroup.name,
    // });
  }
}
