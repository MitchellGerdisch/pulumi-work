import * as pulumi from "@pulumi/pulumi";
import { PulumiEnvironment } from "./pulumiEnvironmentProvider";

const config = new pulumi.Config()
const envName = config.get("envName") || "myTestEnv"

// Create an environment in the stack's orgnanization.
const escEnvironment = new PulumiEnvironment("myEscEnv", {
  orgName: pulumi.getOrganization(),
  environmentName: envName
})

export const environmentName = escEnvironment.id