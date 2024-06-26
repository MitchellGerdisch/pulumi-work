# dynamic-provider-pulumicloud

This folder contains dynamic providers written in javascript, typescript and python that show how to use environment variables for credentials so as to avoid storing the (encrypted) credentials in state. This means `pulumi destroy` can run after changing the credentials without having to run `pulumi up` first to refresh the credentials in state.

The example dynamic provider uses the Pulumi Cloud REST API to manage the creation/deletion of an ESC environment in a given Pulumi org. 

## Set Up
An environment variable named `PULUMI_ACCESS_TOKEN` needs to be set to a Pulumi access token with the permissions needed to create and delete an ESC Environment in the given organization:
* `export PULUMI_ACCESS_TOKEN=xxxxxxxx`

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
* At this point if you run `pulumi stack export` and look at the dynamic resource provider, you will see that the access token is nowhere to be seen (encrypted or not) and instead the dynamic resource provider code that is serialized into state references the environment variable directly.
* `pulumi destroy`

### Javascript Example
* `cd dyn-provider-pulumicloud-js`
* `npm i`
* `pulumi stack init dev`
* (optional) `pulumi config set envName YYYYY`
  * Where `YYYYY` is the name of the environment to create.
  * If not set, it defaults to `myTestEnv`.
* `pulumi up`
  * Once complete, check the Pulumi Cloud org for the given environment name.
* At this point if you run `pulumi stack export` and look at the dynamic resource provider, you will see that the access token is nowhere to be seen (encrypted or not) and instead the dynamic resource provider code that is serialized into state references the environment variable directly.
* `pulumi destroy`

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
* At this point if you run `pulumi stack export` and look at the dynamic resource provider, you will see that the access token is nowhere to be seen (encrypted or not) and instead the dynamic resource provider code that is serialized into state references the environment variable directly.
* `pulumi destroy`



