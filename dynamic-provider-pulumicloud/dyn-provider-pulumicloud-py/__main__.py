"""A Python Pulumi program"""

import pulumi
from pulumiEnvironmentProvider import PulumiEnvironment, PulumiEnvironmentArgs

config = pulumi.Config()
envName = config.get("envName") or "myTestEnv"

esc_environment = PulumiEnvironment("myEscEnv", PulumiEnvironmentArgs(
  org_name=pulumi.get_organization(),
  environment_name=envName,
))

pulumi.export("environmentName", esc_environment.id)
