# ts-azure-oidc-env
There are two projects in this folder:
- ts-azure-storage: This is the project that is run to test the OIDC configuration set up in Pulumi ESC as an environment.
- azure-oidc-env-config: This project is used to capture the necessary setup for creating the Azure AD app that is used for the Pulumi ESC Env OIDC configuration. 

## References
- Pulumi ESC: 
  - https://www.pulumi.com/docs/concepts/environments/
  - https://www.pulumi.com/docs/pulumi-cloud/esc/
- ESC command line: 
  - https://www.pulumi.com/docs/cli/commands/pulumi_env/

## How to use
### Set up Azure application for OIDC and Pulumi ESC environment to use it
#### Configuration
The defaults for the code assume this stack is being deployed in the same Pulumi organization in which the test stack will be deployed and that the ESC environment will be named `azure-oidc`.

To use different settings, you can set the following config values:
```bash
pulumi config set escEnvName ENV_NAME_OF_YOUR_CHOOSING
pulumi config set escEnvOrg ORG_NAME_WHERE_ENVIRONMENT_WILL_BE_CREATED
```

#### Run Stack
This step will create the needed resources in Azure to support using OIDC to authenticate.
```bash
cd ../azure-oidc-config
pulumi stack init ORG/STACK
pulumi up -y
```

This will produce the YAML to use for the environment. It also provides some instructions on creating the environment in Pulumi Cloud.

#### Configure ESC Environment
Using the YAML output from the previous step, use the Pulumi Cloud UI or the `esc env` command line to create the given environment in the given org. 

### Run Pulumi stack that uses the Pulumi ESC environment.
This stack's `Pulumi.dev.yaml` stack config file is set up to point at the ESC environment setup and in the previous section.  
If you use a different stack name, copy the environment section from `Pulumi.dev.yaml`.  
Similarly, if you name the environment something other than `azure-oidc` update the environment section of the stack's config file accordingly.

```bash
cd ts-azure-storage
pulumi stack init dev # If you use a different stack name copy Pulumi.dev.yaml
pulumi up -y
```
