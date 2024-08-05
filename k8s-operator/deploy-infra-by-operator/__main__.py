import pulumi
from pulumi_kubernetes import core, apiextensions
import pulumi_kubernetes as kubernetes

# Get the Pulumi API token.
pulumi_config = pulumi.Config("pulumiservice")
pulumi_access_token = pulumi_config.require_secret("accessToken")

k8sprovider = kubernetes.Provider("k8sprovider", kubeconfig=pulumi.Config().require_secret("kubeconfig"))

# Create the creds as Kubernetes Secrets.
access_token = core.v1.Secret("accesstoken", string_data={ "access_token": pulumi_access_token },
                              opts=pulumi.ResourceOptions(provider=k8sprovider))

# Create a simple project that uses the random provider.
my_stack = apiextensions.CustomResource("my-stack",
    api_version="pulumi.com/v1",
    kind="Stack",
    spec={
        "stack": "pequod/pulumi-random-project/dev",
        "projectRepo": "https://github.com/MitchellGerdisch/pulumi-random-project",
        "branch": "main",
        # "commit": "0eaee959fcc70d0566e4b5fa63f01dd094617d85",
        "envRefs": {
            "PULUMI_ACCESS_TOKEN": {
                "type": "Secret",
                "secret": {
                    "name": access_token.metadata.name,
                    "key": "access_token",
                }
            },
        },
        "initOnCreate": True,
        "destroyOnFinalize": True,
    },
    opts=pulumi.ResourceOptions(provider=k8sprovider))