import * as pulumi from "@pulumi/pulumi";

const pulumiConfig = new pulumi.Config();

// Get the Pulumi stack information
export const pulumiOrg = pulumiConfig.get("pulumiOrg") || pulumi.getOrganization()
export const projectName = pulumiConfig.require("projectName")
export const stackName = pulumiConfig.get("stackName") || pulumi.getStack()

// Deduce the git repo information.
// For Pequod, the git org name is "pulumi-pequod," so just assuming the same naming convention is used for other orgs.
// If not, modify this accordingly.
export const gitRepo = `https://github.com/pulumi-${pulumiOrg}/${projectName}`

// Get the Pulumi and Github access tokens
export const pulumiAccessToken = pulumiConfig.requireSecret("pulumiAccessToken")
export const githubAccessToken = pulumiConfig.requireSecret("githubAccessToken")

// Get the k8s kubeconfig
export const kubeconfig = pulumiConfig.require("kubeconfig")  

// Get the AWS region
const awsConfig = new pulumi.Config("aws")
export const region = awsConfig.require("region")