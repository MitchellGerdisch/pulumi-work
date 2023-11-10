# ts-azure-oidc-env
There are two projects in this folder:
- ts-azure-storage: This is the project that is run to test the OIDC configuration set up in Pulumi ESC as an environment.
- azure-oidc-config: This project is used to capture the necessary setup for creating the Azure AD app that is used for the Deployments OIDC configuration. It also configures the deployment settings for the 

## How to use
```bash
cd ts-azure-storage
pulumi stack init ORG/STACK
pulumi up -y

cd ../azure-oidc-config
pulumi stack init ORG/STACK
pulumi up -y
```