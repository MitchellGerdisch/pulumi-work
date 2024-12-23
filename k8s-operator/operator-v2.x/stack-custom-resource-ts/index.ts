import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

// Get the config
import * as config from "./config";

// Instantiate k8s provider
const k8sProvider = new k8s.Provider("k8s-provider", {
    kubeconfig: config.kubeconfig,
    deleteUnreachable: true,
});

const namespace = new k8s.core.v1.Namespace(config.projectName, {
    metadata: { name: config.projectName },
}, {provider: k8sProvider});

// Create a Kubernetes Secret
const accessTokenSecrets = new k8s.core.v1.Secret("access-tokens", {
    metadata: {
        name: "access-tokens",
        namespace: namespace.metadata.name,
    },
    stringData: {
        // Base64 encoded value
        // pulumiaccesstoken: config.pulumiAccessToken.apply(token => Buffer.from(token).toString("base64")),
        // githubaccesstoken: config.githubAccessToken.apply(token => Buffer.from(token).toString("base64")),
        pulumiaccesstoken: config.pulumiAccessToken,
        githubaccesstoken: config.githubAccessToken,
        aws_access_key_id: process.env.AWS_ACCESS_KEY_ID || "undefined",
        aws_secret_access: process.env.AWS_SECRET_ACCESS_KEY || "undefined",
        aws_session_token: process.env.AWS_SESSION_TOKEN || "undefined",
    },
    type: "Opaque", // Default type for generic secrets
}, { provider: k8sProvider });

// Create service account
const serviceAccount = new k8s.core.v1.ServiceAccount(`${config.projectName}-${config.stackName}-sa`, {
    metadata: {
        name: `${config.projectName}-${config.stackName}-sa`,
        namespace: namespace.metadata.name,
    },
}, { provider: k8sProvider });

// Create a ClusterRoleBinding
const clusterRoleBinding = new k8s.rbac.v1.ClusterRoleBinding(`${config.projectName}-${config.stackName}-crb`, {
    metadata: {
        name: `${config.projectName}-${config.stackName}-crb`,
        namespace: namespace.metadata.name,
    },
    roleRef: {
        apiGroup: "rbac.authorization.k8s.io",
        kind: "ClusterRole",
        name: "system:auth-delegator",
    },
    subjects: [{
        kind: "ServiceAccount",
        name: serviceAccount.metadata.name,
        namespace: namespace.metadata.name,
    }],
}, { provider: k8sProvider });

// Create the stack custom resource for the stack.
const stackResource = new k8s.apiextensions.CustomResource(`${config.projectName}-${config.stackName}`, {
    apiVersion: 'pulumi.com/v1',
    kind: 'Stack',
    metadata: {
        name: `${config.projectName}-${config.stackName}`,
        namespace: namespace.metadata.name,
        annotations: { 
            "pulumi.com/waitFor": "condition=Ready",
            "pulumi.com/deletionPropagationPolicy": "background"
        }
    },
    spec: {
        serviceAccountName: serviceAccount.metadata.name,
        gitAuth: {
            accessToken: {
                type: "Secret",
                secret: {
                    name: accessTokenSecrets.metadata.name,
                    key: "githubaccesstoken"
                }
            },
        },
        envRefs: {
            PULUMI_ACCESS_TOKEN: {
                type: "Secret",
                secret: {
                    name: accessTokenSecrets.metadata.name,
                    key: "pulumiaccesstoken"
                },
            },
            AWS_ACCESS_KEY_ID: {
                type: "Secret",
                secret: {
                    name: accessTokenSecrets.metadata.name,
                    key: "aws_access_key_id"
                },
            },
            AWS_SECRET_ACCESS_KEY: {
                type: "Secret",
                secret: {
                    name: accessTokenSecrets.metadata.name,
                    key: "aws_secret_access"
                },
            },  
            AWS_SESSION_TOKEN: {
                type: "Secret",
                secret: {
                    name: accessTokenSecrets.metadata.name,
                    key: "aws_session_token"
                },
            },  
        },
        config: {
            "aws:region": config.region,
        },
        stack: `${config.pulumiOrg}/${config.projectName}/${config.stackName}`, 
        projectRepo: config.gitRepo,
        branch: "refs/heads/main", // track changes to main branch.
        destroyOnFinalize: false, 
    }
}, { provider: k8sProvider, dependsOn: [clusterRoleBinding], customTimeouts: { delete: "60m" } });

export const kubeconfig = pulumi.secret(config.kubeconfig);

