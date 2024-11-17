# dynamic-provider-pulumicloud

This folder contains dynamic providers written in javascript, typescript and python that show how to pass credentials to a dynamic provider.
The example dynamic provider uses the Pulumi Cloud REST API to manage the creation/deletion of an ESC environment in a given Pulumi org. 

The dynamic providers use a Pulumi access token to be able to interface with Pulumi Cloud.

Two models of passing the access token are supported:
- Passing the cred as an environment variable.
- Passing the cred using Pulumi config.

**NOTE** When using config to pass the credential, if you change the credential between a `pulumi up` and a `pulumi destroy`, a `pulumi up` is needed before the `pulumi destroy` will succeed.
This is because when using config, the credential is stored in state (encrypted, so safe) and `pulumi destroy` uses state for the destroy.

**IF** using environment variable to pass the credential, then the `pulumi up` before the `destroy` is NOT needed since when using an environment variable for the credential, the credential is not stored in state.


## Set Up
The easiest way to use the examples is to use a Pulumi ESC environment of the form:
```
values:
  pulumiAccessToken:
    fn::secret:
      ciphertext: xxxxxxxxxxxxxxxxxxxxx
  ### Comment out environmentVariables section if you want to test with config.
  ### NOTE: If using config instead of environment variable, and you change the token value above, 
  ### you will need to run `pulumi up` before destroy to get the new token into state.
  ### Running an up before destroy is not needed in this scenario if using the environent variable.
  environmentVariables:
    PULUMI_ACCESS_TOKEN: ${pulumiAccessToken}
  pulumiConfig:
    pulumiAccessToken: ${pulumiAccessToken}
```

And then reference the environment in the `Pulumi.dev.yaml` stack config file. 

## Usage
### Typescript Example
* `cd dyn-provider-pulumicloud-ts`
* `npm i`
* `pulumi stack init dev`
* (optional) `pulumi config set envName YYYYY`
  * Where `YYYYY` is the name of the environment to create.
  * If not set, it defaults to `myTestEnv`.
* `pulumi up`
  * Once complete, check the Pulumi Cloud org for the given environment name.
* `pulumi destroy -y`

### Javascript Example
* `cd dyn-provider-pulumicloud-js`
* `npm i`
* `pulumi stack init dev`
* (optional) `pulumi config set envName YYYYY`
  * Where `YYYYY` is the name of the environment to create.
  * If not set, it defaults to `myTestEnv`.
* `pulumi up`
  * Once complete, check the Pulumi Cloud org for the given environment name.
* `pulumi destroy -y`

### Python Example
* `cd dyn-provider-pulumicloud-ts`
* `python3 -m venv venv; source ./venv/bin/activate`
* `pip install -r requirements.txt`
* `pulumi stack init dev`
* (optional) `pulumi config set envName YYYYY`
  * Where `YYYYY` is the name of the environment to create.
  * If not set, it defaults to `myTestEnv`.
* `pulumi up`
  * Once complete, check the Pulumi Cloud org for the given environment name.
* `pulumi destroy -y`



