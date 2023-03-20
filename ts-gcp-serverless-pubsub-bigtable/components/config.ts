import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config()

export const nameBase = config.get("nameBase") ?? "data-pipeline"

export const baseProjectName = config.get("baseProjectName")

export const bigtableNumNodes = config.getNumber("bigtableNumNodes") ?? 1
export const bigtableStorageType = config.get("bigtableStorageType") ?? "SSD"

const gcpConfig = new pulumi.Config("gcp")
const gcpRegion = gcpConfig.require("region") 
export const bigtableLocation = `${gcpRegion}-a`