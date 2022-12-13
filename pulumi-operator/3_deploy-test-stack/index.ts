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

// Create a stack in the operator that uses my simple random pet project
// See: https://github.com/pulumi/pulumi-kubernetes-operator/blob/master/docs/create-stacks-using-pulumi-ts.md#aws-s3-buckets
const mystack = new k8s.apiextensions.CustomResource("my-stack", {
  apiVersion: 'pulumi.com/v1',
  kind: 'Stack',
  spec: {
      stack: "MitchGerdisch/simple-stack/k8sopertest",
      projectRepo: "https://github.com/MitchellGerdisch/pulumi-work",
      repoDir: "ts-random-simple-stack",
      branch: "refs/heads/master",
      accessTokenSecret: accessToken.metadata.name,
      config: {
          "simple-stack:petLength": "8",
      },
      destroyOnFinalize: true,
  }
});
