import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

import { Backend } from "./backend";
import { Frontend } from "./frontend";

import { Bus } from "./bus";

import { nameBase } from "./config";

// Create pubsub topic and subscription
const pubsub = new Bus(nameBase)

// Create frontend api to feed the pubsub topic
const frontend = new Frontend(nameBase, {
  appPath: "./frontend-app",
  topicName: pubsub.topicName,
})
export const frontendUrl = frontend.url

// Create backend process to consume topic and push to table
const backend = new Backend(nameBase, {
  zone: "us-central1-a"
})
