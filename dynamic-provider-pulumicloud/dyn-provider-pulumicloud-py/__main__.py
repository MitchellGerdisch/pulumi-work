"""A Python Pulumi program"""

import pulumi
from pulumiEnvironmentProvider import PulumiEnvironment, PulumiEnvironmentArgs
import config 

esc_environment = PulumiEnvironment("myEscEnv", PulumiEnvironmentArgs(
  org_name=pulumi.get_organization(),
  environment_name=config.envName,
))

pulumi.export("environmentName", esc_environment.id)
