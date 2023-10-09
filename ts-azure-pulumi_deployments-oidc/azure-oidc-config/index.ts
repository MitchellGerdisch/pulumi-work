import * as pulumi from "@pulumi/pulumi";
import * as pcloud from "@pulumi/pulumiservice";
import * as azuread from "@pulumi/azuread";
import * as azure from "@pulumi/azure-native";
import * as auth from "@pulumi/azure-native/authorization";
import * as azureclassic from "@pulumi/azure";

// Assuming this stack that sets up the OIDC stuff is being run in the same org as the stack for which
// the deployment config is being setup.
const org = pulumi.getOrganization()

// Need to provide information about the stack for which the OIDC stuff is being configured.
const config = new pulumi.Config()
const deployedProject = config.require("deployedProject")
const deployedStack = config.require("deployedStack")
const deployedRepoUrl = config.require("deployedRepoUrl")
const deployedRepoDir = config.require("deployedRepoDir")
const deployedRepoBranch = config.require("deployedRepoBranch")

const name = "demo-deploy-oidc"
const currentClient = auth.getClientConfigOutput()
const clientOwners = [currentClient.objectId]
export const subscriptionId = currentClient.subscriptionId
const fullSubId = pulumi.interpolate`subscriptions/${subscriptionId}`
export const tenantId = currentClient.tenantId

// Create Azure application
const appName = `${name}-app`
const adApp = new azuread.Application(appName, {
    displayName: appName,
    owners: clientOwners,
});
export const clientId = adApp.applicationId

// Configure necessary subjects needed for Pulumi deployments Azure OIDC support.
// See: https://www.pulumi.com/docs/pulumi-cloud/deployments/oidc/azure/#adding-federated-credentials
const fedIdCredName = `${name}-fed-id-cred`
const stackActions = ["preview", "update", "refresh", "destroy"]
const issuer = "https://api.pulumi.com/oidc"
for (let stackAction of stackActions) {
    const subject = `pulumi:deploy:org:${org}:project:${deployedProject}:stack:${deployedStack}:operation:${stackAction}:scope:write`
    const actionFedIdCredName = `${fedIdCredName}-${stackAction}`
    const adFedIdCred = new azuread.ApplicationFederatedIdentityCredential(actionFedIdCredName, {
        applicationObjectId: adApp.objectId,
        displayName: actionFedIdCredName,
        audiences: [org],
        issuer: issuer,
        subject: subject,
    })
}

// Create a service principal for the app.
const adSp = new azuread.ServicePrincipal(`${name}-sp`, {
    applicationId: adApp.applicationId,
});

// Now assigne roles to 
// Using Azure built-in roles which have UUIDs for their "names"
// This page provides links to the various built-in roles and by clicking through their names you'll see JSON which provides the role ID
// https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles

// Identifying a few of these roles that are applicable to the project being managed by this OIDC thing
// A king and pope role
// const CONTRIBUTOR="b24988ac-6180-42a0-ab88-20f7382dd24c"
// More targeted to the ts-azure-storage project that is colocated with this code
const STORAGE_ACCOUNT_CONTRIBUTOR="17d1049b-9a84-46fb-8f53-869881c3d3ab"
const STORAGE_BLOB_DATA_CONTRIBUTOR="ba92f5b4-2d11-453d-a403-e96b0029c9fe"
const STORAGE_ACCOUNT_KEY_OPERATOR="81a9662b-bebf-436f-a333-f67b29880f12"

// There is no built-in role for resource group management.
// So creating one ...
// Define the role
const rgRoleName = `${name}-rg-role`
const rgRoleDef = new auth.RoleDefinition(rgRoleName, {
    scope: fullSubId,
    assignableScopes: [fullSubId],
    roleName: rgRoleName,
    permissions: [{
        actions: [ // Here you define the permissions this role has
            "Microsoft.Resources/subscriptions/resourceGroups/write",
            "Microsoft.Resources/subscriptions/resourceGroups/delete",
        ],
        notActions: [],
    }],
    description: "This is a custom role that manages resource groups.",
});

// Could just set the role assignment to CONTRIBUTOR role and be done with things.
// But this way shows creating assignments for a set of more limited roles.
const rolesInfo = [
    {name: rgRoleName, roleDefId: rgRoleDef.id}, 
    {name: "STORAGE_ACCOUNT_CONTRIBUTOR", roleDefId: pulumi.interpolate`${fullSubId}/providers/Microsoft.Authorization/roleDefinitions/${STORAGE_ACCOUNT_CONTRIBUTOR}`}, 
    {name: "STORAGE_BLOB_DATA_CONTRIBUTOR", roleDefId: pulumi.interpolate`${fullSubId}/providers/Microsoft.Authorization/roleDefinitions/${STORAGE_BLOB_DATA_CONTRIBUTOR}`},
    {name: "STORAGE_ACCOUNT_KEY_OPERATOR", roleDefId: pulumi.interpolate`${fullSubId}/providers/Microsoft.Authorization/roleDefinitions/${STORAGE_ACCOUNT_KEY_OPERATOR}`},
]

for (let roleInfo of rolesInfo) {
    const roleName = roleInfo.name
    const roleDefId = roleInfo.roleDefId
    const roleAssignment = new auth.RoleAssignment(roleName, {
        principalId: adSp.id, 
        principalType: "ServicePrincipal",
        roleDefinitionId: roleDefId,
        scope: fullSubId,
    });
}

const settings = new pcloud.DeploymentSettings("deployment_settings", {
    organization: org,
    project: deployedProject,
    stack: deployedStack,
    sourceContext: {
        git: {
            repoUrl: deployedRepoUrl,
            branch: deployedRepoBranch,
            repoDir: deployedRepoDir,
        }
    },
    operationContext: {
        oidc: {
            azure: {
                clientId: clientId,
                tenantId: tenantId,
                subscriptionId: subscriptionId
            }
        },
        // Some test code
        preRunCommands: [
            // Sets up some env variables for the deployment stage so the Azure Native provider can run using the OIDC settings.
            // There is an update for Pulumi cloud being worked to address this so that these prerun commands are not needed. 
            // See https://www.pulumi.com/docs/pulumi-cloud/deployments/api/#operationcontext for more about the /PULUMI_ENV file.
            "echo ARM_OIDC_REQUEST_URL=https://api.pulumi.com/oidc  >> /PULUMI_ENV",
            "echo ARM_OIDC_REQUEST_TOKEN=$ARM_OIDC_TOKEN >> /PULUMI_ENV",
        ]
    },
});

/*
# Additional PRERUN commands that can be used to test things
echo "arm_client_id: $ARM_CLIENT_ID"
echo "arm_tenant_id: $ARM_TENANT_ID"
echo "arm_sub_id: $ARM_SUBSCRIPTION_ID"
echo "arm_oidc_token: $ARM_OIDC_TOKEN"
echo "pulumi_oidc_token: $PULUMI_OIDC_TOKEN"
echo "arm_oidc_request_token: $ARM_OIDC_REQUEST_TOKEN"
echo "arm_oidc_request_url: $ARM_OIDC_REQUEST_URL"
az login --service-principal -u $ARM_CLIENT_ID -t $ARM_TENANT_ID --federated-token $ARM_OIDC_TOKEN

## This one was used to validate the OIDC stuff actually works 
ARM_OIDC_REQUEST_URL=https://api.pulumi.com/oidc ARM_OIDC_REQUEST_TOKEN=$ARM_OIDC_TOKEN /pulumi-deploy-executor pulumi preview --stackIdentity="MitchGerdisch/ts-azure-storage/dev" --workDir="/deployment/ts-azure-pulumi_deployments-oidc/ts-azure-storage"

*/

