# A dynamic provider for Pulumi Cloud ESC Environments that uses Environment Variables to pass in the credentials
# Using environment variables as such allows one to keep the actual credential value out of state.
# Although if the cred is in state, it is encypted, if the token is changed between the create and the destroy, 
# the destroy will be able to use the new cred found in the environment variable instead of using a value from state. 

# REQUIRES/SUPPORTS the following environment variables:
# * PULUMI_ACCESS_TOKEN: (required) This is a Pulumi access token with the necessary permissions to create an ESC Environment in a given Pulumi Cloud organization.
# * PULUMI_CLOUD_API_URL: (optional) This is the URL for the Pulumi Cloud API endpoint. Defaults to `https://api.pulumi.com`.

import pulumi
from pulumi import Input, Output
from pulumi.dynamic import ResourceProvider, CreateResult, Resource, ConfigureRequest
import requests
import os
# from config import token

# config = pulumi.Config()
# token = config.require_secret("pulumiAccessToken")

class PulumiEnvironmentArgs:
    def __init__(self, org_name: str, environment_name: str):
        self.org_name = org_name
        self.environment_name = environment_name

class PulumiEnvironmentProviderArgs:
    def __init__(self, org_name: str, environment_name: str):
        self.org_name = org_name
        self.environment_name = environment_name

class PulumiEnvironmentProvider(ResourceProvider):

    # initialize local values
    headers: object
    base_pulumi_env_api_url: str

    # Gather up the confuration values as applicable.
    def configure(self, req: ConfigureRequest):
        # Use environment variable or config value for the access token 
        # ***NOTE*** If using the config option, and you rotate the token, you will need to run a `pulumi up` before destroying the stack.
        # This is needed to update the state with the latest token.
        # HOWEVER, if using environment variables, then the token is not stored in the state, and the new token will be used on the destroy.
        if (os.getenv('PULUMI_ACCESS_TOKEN')):
            print("Obtained token from environment variable")
            self.access_token = os.getenv('PULUMI_ACCESS_TOKEN')
        else:
            print("Obtained token from config")
            self.access_token = req.config.require("pulumiAccessToken") 

        self.headers = {
            'Authorization': f"token {self.access_token}",
            'Content-Type': 'application/json'
        }
        base_pulumi_api_url = os.getenv("PULUMI_CLOUD_API_URL", "https://api.pulumi.com")
        self.base_pulumi_env_api_url = f"{base_pulumi_api_url}/api/preview/environments"

    def create(self, inputs: PulumiEnvironmentProviderArgs) -> CreateResult:
        create_env_url = f"{self.base_pulumi_env_api_url}/{inputs['org_name']}/{inputs['environment_name']}"

        env_id = "unassigned"
        response = requests.post(create_env_url, headers=self.headers)
        if response.status_code == 200 or response.status_code == 201:
            env_id = f"{inputs['org_name']}/{inputs['environment_name']}"
        else:
            print(f"ERROR: {response.status_code} - {response.text}")
            os._exit(10)

        env_outs = {"id": env_id, "envName": inputs['environment_name'], "orgName": inputs['org_name']}
        return CreateResult(id_=env_id, outs=env_outs)

    def delete(self, id: str, props):

        # The id provides the "org/environment-name" path for the environment
        delete_env_url = f"{self.base_pulumi_env_api_url}/{id}"

        response = requests.delete(delete_env_url, headers=self.headers)
        if response.status_code != 200:
            print(f"ERROR: {response.status_code} - {response.text}")
            os._exit(20)

class PulumiEnvironment(Resource):
    def __init__(self, name, args: PulumiEnvironmentArgs, opts=None):
        super().__init__(PulumiEnvironmentProvider(), name, vars(args), opts)