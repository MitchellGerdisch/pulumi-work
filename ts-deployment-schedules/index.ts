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
  operationContext: {
    preRunCommands: ["pulumi about"]
  },
  // agentPoolId: "",
  // operationContext: {},
  sourceContext: {
    git: {
      branch: "master",
      repoUrl: gitOrigin,
      repoDir: "ts-deployment-schedules"
    }
  }
})

const driftSchedule = new ps.DriftSchedule("driftSchedule", {
  organization: org,
  project: project,
  stack: stack,
  scheduleCron: "0 * * * *",
  autoRemediate: true
}, {dependsOn: [deploymentSettings]})

const ttlSchedule = new ps.TtlSchedule("ttlSchedule", {
  organization: org,
  project: project,
  stack: stack,
  timestamp: "2025-01-01T00:00:00Z"
}, {dependsOn: [deploymentSettings]})

const rawSchedule = new ps.DeploymentSchedule("rawSchedule", {
  organization: org,
  project: project,
  stack: stack,
  scheduleCron: "0 0 1 1 *",
  pulumiOperation: "preview"
}, {dependsOn: [deploymentSettings]})