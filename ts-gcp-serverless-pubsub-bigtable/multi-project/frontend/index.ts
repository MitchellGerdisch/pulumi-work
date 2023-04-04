import * as pulumi from "@pulumi/pulumi";
import * as pulumiservice from "@pulumi/pulumiservice";

import { Frontend } from "../../components/frontend";

import { nameBase }  from "../../components/config";

const feConfig = new pulumi.Config()
const baseProjectName = feConfig.require("baseProjectName")
const baseStackRef = new pulumi.StackReference(`${pulumi.getOrganization()}/${baseProjectName}/${pulumi.getStack()}`)
const pubsubTopicName = baseStackRef.getOutput("pubsubTopicName")

// Create frontend api to feed the pubsub topic
const frontend = new Frontend(nameBase, {
  appPath: "../../application-code/frontend-app",
  topicName: pubsubTopicName,
})

// Add a stack tag in Pulumi
const stackTag =  new pulumiservice.StackTag("stackTag", {
  organization: pulumi.getOrganization(),
  project: pulumi.getProject(),
  stack: pulumi.getStack(),
  name: "Application",
  value: "GCP Data Pipeline"
})

export const frontendUrl = frontend.url


