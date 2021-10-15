import * as pulumi from "@pulumi/pulumi";
import { StaticWebsite } from "./azure-static-website";

const config = new pulumi.Config
const domainName = config.get("domainName") || "nodomainprovided"
const location = config.require("location")
const nameBase = config.require("nameBase")
const cdnSku = config.require("cdnSku")

const website = new StaticWebsite(`${nameBase}website`, {
  customDomain: domainName,
  location: location,
  storageSku: "Standard_LRS",
  cdnSku: cdnSku, //"Standard_Verizon",
});

export const staticSiteUrl  = pulumi.interpolate`https://${website.primaryWebEndpoint}`;
export let cdnEndpointUrl = website.cdnEndpointUrl;