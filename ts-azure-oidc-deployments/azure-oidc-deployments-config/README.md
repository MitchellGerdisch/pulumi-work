# Pulumi Deployment - Using Azure OIDC and git examples using github or azuredevops
This project configures Pulumi Deployment settings for a deployment to Azure using Azure OIDC.

There are two stack configs defined here:
- git-github: This is a basic git deployment configuration where the source code is in github. 
  - Specifically, this is set up to work with the ts-azure-storage project colocated with this project. 
- git-azuredevops: This is a basic git deployment configuration where the source code is in an AzureDevops repo.


# How to use
- Deploy a stack that is stored in a github repo or an azuredevops repo.
  - Use this stack's project and stack name for configuring things below.
- Select the stack you want to work with - `git-github` or `git-azuredevops`
```bash
pulumi stack select STACKOFCHOICE
```
- The set the config accordingly. You can look at Pulumi.STACKOFCHOICE.yaml for settings that were used
  - Similarly you can look at the code to see what config values are collected and used by the code.
```bash
pulumi config set deployedProject XXXX
pulumi config set deployedStack YYYY
etc
```
- Run `pulumi up` to set up the Azure app and permissions and to configure the deployment settings for the stack specified in the config.