import * as pulumi from "@pulumi/pulumi";

import { Frontend } from "../components/frontend";

import { nameBase, baseProjectName } from "../components/config";

if (!baseProjectName) {
  console.log("Missing base infrastructure project name.")
  new pulumi.
}



// Create frontend api to feed the pubsub topic
const frontend = new Frontend(nameBase, {
  appPath: "../frontend-app",
  topicName: pubsub.topicName,
})
export const frontendUrl = frontend.url

// Create backend process to consume topic and push to table
const backend = new Backend(nameBase, {
  appPath: "../backend-app",
  pubsubTopicName: pubsub.topicName,
  pubsubTopicId: pubsub.topicId,
  location: bigtableLocation,
  storageType: bigtableStorageType,
  numNodes: bigtableNumNodes,
})

export const cbtCommand= pulumi.interpolate`cbt -instance ${backend.tableInstance} read ${backend.tableName}`

