import pulumi
import pulumiEnvironmentProvider
config = pulumi.Config()
envName = config.get("envName") or "myTestEnv"
