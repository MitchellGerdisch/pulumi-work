import * as pulumi from "@pulumi/pulumi";

import { Backend } from "../components/backend";
import { Frontend } from "../components/frontend";

import { Bus } from "../components/bus";

import { nameBase, bigtableLocation, bigtableNumNodes, bigtableStorageType } from "../components/config";

// Create pubsub topic and subscription
const pubsub = new Bus(nameBase)

// Create frontend api to feed the pubsub topic
const frontend = new Frontend(nameBase, {
  appPath: "../application-code/frontend-app",
  topicName: pubsub.topicName,
})
export const frontendUrl = frontend.url

// Create backend process to consume topic and push to table
const backend = new Backend(nameBase, {
  appPath: "../application-code/backend-app",
  pubsubTopicName: pubsub.topicName,
  pubsubTopicId: pubsub.topicId,
  location: bigtableLocation,
  storageType: bigtableStorageType,
  numNodes: bigtableNumNodes,
})

// Add a stack tag in Pulumi
const stackTag =  new pulumiservice.StackTag("stackTag", {
  organization: pulumi.getOrganization(),
  project: pulumi.getProject(),
  stack: pulumi.getStack(),
  name: "Application",
  value: "GCP Data Pipeline"
})

export const cbtCommand= pulumi.interpolate`cbt -instance ${backend.tableInstance} read ${backend.tableName}`

