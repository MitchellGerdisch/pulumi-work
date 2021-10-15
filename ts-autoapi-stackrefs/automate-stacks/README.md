# Stack Reference and Automation Demo

Demonstrates the following:

- Stack References
- Automation API.

# Architecture

Consists of the following folders:

- `web-base`: Pulumi project that deploys a resource group and storage account. Outputs their names.
- `web-app`: Pulumi project that deploys a static website on the resource group and storage account. Outputs the page link.
- `automate-stacks`: Typescript programs that use the Automation API to orchestrate the stacks.

# How to Use

- `cd automate-stacks`
- `npm run update` to deploy
- `npm run destroy` to destroy

# Talking Points

- `web-app` has a stack reference to `web-base` used to create the static website on the resource group and storage account created by `web-base`.
- Automatically manages the stack name bookkeeping by populating the config file for the stack so that you don't have to.
- Supports various environment variables to drive behavior which is how this would be used in a CI/CD pipeline.
  - `STACK_NAME` - defaults to "dev" but multiple stacks can be deployed by changing the `STACK_NAME`.
  - `PULUMI_ORG` - defaults to "demo".
  - `LOCATION` - defaults to "CentralUS".
