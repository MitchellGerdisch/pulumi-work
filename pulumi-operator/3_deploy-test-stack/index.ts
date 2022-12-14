import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";

// Get the Pulumi API token and AWS creds.
const pulumiConfig = new pulumi.Config();
const pulumiAccessToken = pulumiConfig.requireSecret("pulumiAccessToken")

// Create the creds as Kubernetes Secrets.
const accessToken = new kx.Secret("accesstoken", {
    stringData: { accessToken: pulumiAccessToken},
});

const numGoodStacks = 2
for (let i = 0; i < numGoodStacks; i++) {

    // Put in some variability in the config
    const petLength = (3+(i*2))

    // Create a stack in the operator that uses my simple random pet project
    // See: https://github.com/pulumi/pulumi-kubernetes-operator/blob/master/docs/create-stacks-using-pulumi-ts.md#aws-s3-buckets
    const mystack = new k8s.apiextensions.CustomResource(`my-stack-${i}`, {
    apiVersion: 'pulumi.com/v1',
    kind: 'Stack',
    spec: {
        stack: `MitchGerdisch/simple-stack/k8sopertest-${i}`,
        projectRepo: "https://github.com/MitchellGerdisch/pulumi-work",
        repoDir: "ts-random-simple-stack",
        branch: "refs/heads/master",
        accessTokenSecret: accessToken.metadata.name,
        config: {
            "simple-stack:petLength": `${petLength}`
        },
        destroyOnFinalize: true,
    }
    });
}

const numBadStacks = 4
for (let i = 0; i < numBadStacks; i++) {

    // Create a failed stack in the operator that uses my simple random pet project
    // See: https://github.com/pulumi/pulumi-kubernetes-operator/blob/master/docs/create-stacks-using-pulumi-ts.md#aws-s3-buckets
    const mystack = new k8s.apiextensions.CustomResource(`my-bad-stack-${i}`, {
    apiVersion: 'pulumi.com/v1',
    kind: 'Stack',
    spec: {
        stack: `MitchGerdisch/simple-stack/k8sopertest-fail-${i}`,
        projectRepo: "https://github.com/MitchellGerdisch/pulumi-work",
        repoDir: "ts-random-simple-stack",
        branch: "refs/heads/master",
        accessTokenSecret: accessToken.metadata.name,
        config: {
            "simple-stack:petLength": "badvalue"
        },
        destroyOnFinalize: true,
    }
    });
}
