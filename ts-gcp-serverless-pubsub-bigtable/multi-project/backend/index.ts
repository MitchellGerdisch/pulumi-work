import * as pulumi from "@pulumi/pulumi";

import { Bus } from "../components/bus";
import { Backend } from "../components/backend";

import { nameBase, bigtableLocation, bigtableNumNodes, bigtableStorageType } from "../components/config";

// Create pubsub topic and subscription
const pubsub = new Bus(nameBase)

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

