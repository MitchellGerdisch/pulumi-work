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
export const tenantId = currentClient.tenantId

const appName = `${name}-app`
const adApp = new azuread.Application(appName, {
    displayName: appName,
    owners: clientOwners,
});
export const clientId = adApp.applicationId

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

const adSp = new azuread.ServicePrincipal(`${name}-sp`, {
    applicationId: adApp.applicationId,
});

// Using Azure built-in roles which have UUIDs for their "names"
// This page provides links to the various built-in roles and by clicking through their names you'll see JSON which provides the role ID
// https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles

// Identifying a few of these roles that are applicable to the project being managed by this OIDC thing
// A king and pope role
const CONTRIBUTOR="b24988ac-6180-42a0-ab88-20f7382dd24c"
// More targeted to the ts-azure-storage project that is colocated with this code
const STORAGE_ACCOUNT_CONTRIBUTOR="17d1049b-9a84-46fb-8f53-869881c3d3ab"
const STORAGE_BLOB_DATA_CONTRIBUTOR="ba92f5b4-2d11-453d-a403-e96b0029c9fe"

// Obviously, creating role assignments for the storage contributor roles is unnecessary given the CONTRIBUTOR role.
// But wanted to show/test looping through a set of different roles.
const roleIds = [CONTRIBUTOR, STORAGE_ACCOUNT_CONTRIBUTOR, STORAGE_BLOB_DATA_CONTRIBUTOR]
const fullSubId = pulumi.interpolate`subscriptions/${subscriptionId}`
for (let roleId of roleIds) {
    const roleDefinitionId = pulumi.interpolate`${fullSubId}/providers/Microsoft.Authorization/roleDefinitions/${roleId}`
    const roleAssignment = new auth.RoleAssignment(roleId, {
        principalId: adSp.id, 
        principalType: "ServicePrincipal",
        roleDefinitionId: roleDefinitionId,
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
        }
    }
});

// const adRoleAssignment = new auth.RoleAssignment(`${name}-roleassign`, {
//     principalId: adSp.id,
//     principalType: "ServicePrincipal",

// })

// Creating a role definition
// const roleName = `${name}-role`
// const role = new auth.RoleDefinition(roleName, {
//     roleName: roleName,
//     scope: currentClient.subscriptionId,
//     permissions: [
//         {
//             actions: ["*"],
//             notActions: [],
//         },
//     ],
// });



// const adSpPassword = new azuread.ServicePrincipalPassword(`${name}-sp-pwd`, {
//     servicePrincipalId: adSp.id,
// });

// const generatedKeyPair = new tls.PrivateKey("ssh-key", {
//     algorithm: "RSA",
//     rsaBits: 4096,
// }, {parent: this});
// const sshPublicKey = generatedKeyPair.publicKeyOpenssh;