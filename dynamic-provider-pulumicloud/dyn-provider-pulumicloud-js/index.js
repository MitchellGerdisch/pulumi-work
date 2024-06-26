const pulumi = require("@pulumi/pulumi");
const pulumienv = require("./pulumiEnvironmentProvider");

const config = new pulumi.Config()
const envName = config.get("envName") || "myTestEnv"

// Create an environment in the stack's orgnanization.
const escEnvironment = new pulumienv.PulumiEnvironment("myEscEnv", {
  orgName: pulumi.getOrganization(),
  environmentName: envName
})

exports.environmentName = envName