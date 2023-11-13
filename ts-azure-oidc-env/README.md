# ts-azure-oidc-env
There are two projects in this folder:
- ts-azure-storage: This is the project that is run to test the OIDC configuration set up in Pulumi ESC as an environment.
- azure-oidc-env-config: This project is used to capture the necessary setup for creating the Azure AD app that is used for the Pulumi ESC Env OIDC configuration. 

## How to use
### Set up Azure application for OIDC and Pulumi ESC environment to use it
```bash
cd ../azure-oidc-config
pulumi stack init ORG/STACK
pulumi up -y
```

### Run Pulumi stack that uses the Pulumi ESC environment.
This stack's `Pulumi.dev.yaml` stack config file is set up to point at the ESC environment setup and in the previous section.  
If you use a different stack name, copy the environment section from `Pulumi.dev.yaml`.  
Similarly, if you name the environment something other than `azure-oidc` update the environment section of the stack's config file accordingly.

```bash
cd ts-azure-storage
pulumi stack init dev # If you use a different stack name copy Pulumi.dev.yaml
pulumi up -y
```
