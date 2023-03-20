import * as pulumi from "@pulumi/pulumi";

import { Frontend } from "../../components/frontend";

import { nameBase }  from "../../components/config";

const feConfig = new pulumi.Config()
const baseProjectName = feConfig.require("baseProjectName")
const baseStackRef = new pulumi.StackReference(`${pulumi.getOrganization()}/${baseProjectName}/${pulumi.getStack()}`)
const pubsubTopicName = baseStackRef.getOutput("pubsubTopicName")

// Create frontend api to feed the pubsub topic
const frontend = new Frontend(nameBase, {
  appPath: "../../frontend-app",
  topicName: pubsubTopicName,
})
export const frontendUrl = frontend.url


