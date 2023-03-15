import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config()

export const nameBase = config.get("nameBase") ?? "data-pipeline"