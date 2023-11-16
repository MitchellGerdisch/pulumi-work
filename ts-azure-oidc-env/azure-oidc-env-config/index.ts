import * as pulumi from "@pulumi/pulumi";
import * as azuread from "@pulumi/azuread";
import * as auth from "@pulumi/azure-native/authorization";
import * as YAML from "yaml"


const config = new pulumi.Config()
// The default assumes that this stack is run in the same Pulumi org in which the oidc env is being configured.
// If not, set the escEnvOrg config to the name of the org where the environment is going to be configured.
const org = config.get("escEnvOrg") || pulumi.getOrganization()
// Get the environment name if provided. Otherwise, use default value.
const escEnvName = config.get("escEnvName") || "azure-oidc"

// Gather Azure info for setting up the OIDC resources
const currentClient = auth.getClientConfigOutput()
const clientOwners = [currentClient.objectId]
const subscriptionId = currentClient.subscriptionId
const fullSubId = pulumi.interpolate`subscriptions/${subscriptionId}`
const tenantId = currentClient.tenantId

// naming convention
const name = `${org}-${escEnvName}`

// Create Azure application
const appName = `${name}-app`
const adApp = new azuread.Application(appName, {
    displayName: appName,
    owners: clientOwners,
});

// Configure federated ID creds that match what the ESC env OIDC provider will use when requesting a token.
const fedIdCredName = `${name}-fed-id-cred`
const envs = [escEnvName, "<yaml>"]
const issuer = "https://api.pulumi.com/oidc"
for (let idx in envs) {
    const subject = `pulumi:environments:org:${org}:env:${envs[idx]}`
    const actionFedIdCredName = `${fedIdCredName}-${idx}`
    const adFedIdCred = new azuread.ApplicationFederatedIdentityCredential(actionFedIdCredName, {
        applicationId: adApp.id,
        displayName: actionFedIdCredName,
        audiences: [org],
        issuer: issuer,
        subject: subject,
    })
}

// Create a service principal for the app.
const adSp = new azuread.ServicePrincipal(`${name}-sp`, {
    clientId: adApp.clientId
});

// Using Azure built-in roles which have UUIDs for their "names"
// This page provides links to the various built-in roles and by clicking through their names you'll see JSON which provides the role ID
// https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles

// Identifying a few of these roles that are applicable to the example project co-located with this project.
// When in doubt, the CONTRIBUTOR role can be used.
const CONTRIBUTOR="b24988ac-6180-42a0-ab88-20f7382dd24c"
// More targeted to the ts-azure-storage project that is colocated with this code
const STORAGE_ACCOUNT_CONTRIBUTOR="17d1049b-9a84-46fb-8f53-869881c3d3ab"
const STORAGE_BLOB_DATA_CONTRIBUTOR="ba92f5b4-2d11-453d-a403-e96b0029c9fe"
const STORAGE_ACCOUNT_KEY_OPERATOR="81a9662b-bebf-436f-a333-f67b29880f12"

// There is no built-in role for resource group management.
// So creating one ...
// Define the role
const rgRoleName = `${name}-rg-role`
const rgRoleDef = new auth.RoleDefinition(rgRoleName, {
    roleName: rgRoleName,
    scope: fullSubId,
    assignableScopes: [fullSubId],
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
    {name: "CONTRIBUTOR", roleDefId: pulumi.interpolate`${fullSubId}/providers/Microsoft.Authorization/roleDefinitions/${CONTRIBUTOR}`}, 
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

// Produce JSON that can be used to create the ESC environment YAML for entry in Pulumi Cloud
// NOTE: The "environmentVariables" and "pulumiConfig" sections are redundant and included for reference.
// NOTE: Since neither "ARM_LOCATION_NAME" nor  "azure-native:location" are set, the stack being deployed needs to set the location.
const envJson = pulumi
.all([adApp.clientId, tenantId, subscriptionId])
.apply(([clientId, tenantId, subId]) => { return {
    'values': {
        'azure': {
            'login': {
                'fn::open::azure-login': {
                    'clientId': clientId,
                    'tenantId': tenantId,
                    'subscriptionId': subId,
                    'oidc': true
                }
            }
        },
        'environmentVariables': { 
            'ARM_USE_OIDC': true,
            'ARM_CLIENT_ID': '${azure.login.clientId}',
            'ARM_TENANT_ID': '${azure.login.tenantId}',
            'ARM_OIDC_REQUEST_TOKEN': '${azure.login.oidc.token}',
            'ARM_OIDC_TOKEN': '${azure.login.oidc.token}',
            'ARM_SUBSCRIPTION_ID': '${azure.login.subscriptionId}',
            'ARM_OIDC_REQUEST_URL': issuer
        },
        'pulumiConfig': {
            'azure-native:useOidc': true,
            'azure-native:clientId': '${azure.login.clientId}',
            'azure-native:tenantId': '${azure.login.tenantId}',
            'azure-native:subscriptionId': '${azure.login.subscriptionId}',
            'azure-native:oidcRequestToken': '${azure.login.oidc.token}',
            'azure-native:oidcToken': '${azure.login.oidc.token}',
            'azure-native:oidcRequestUrl': issuer
        }
    }
}})

// Output a YAML doc based on the above JSON that can be copied into the Pulumi environment
envJson.apply(envJson => {
    console.log(`Copy/paste this output BETWEEN "#######" into an environment named, ${escEnvName} in the ${org} Pulumi organization.`)
    console.log("#####################")
    console.log(YAML.stringify(envJson))
    console.log("#####################")
})
