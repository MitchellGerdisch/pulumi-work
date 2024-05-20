import * as pulumi from "@pulumi/pulumi";
import * as ps from "@pulumi/pulumiservice";
import { local } from "@pulumi/command";

const org = pulumi.getOrganization()
const project = pulumi.getProject()
const stack = pulumi.getStack()

const gitOrigin = new local.Command("git_origin", {
  create: 'git config --get remote.origin.url',
}).stdout

const deploymentSettings = new ps.DeploymentSettings("deploymentSettings", {
  organization: org,
  project: project,
  stack: stack,
  agentPoolId: "",
  operationContext: {},
  sourceContext: {
    git: {
      branch: "master",
      repoUrl: gitOrigin,
      repoDir: "ts-deployment-schedules"
    }
  }
})