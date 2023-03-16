import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

import { Backend } from "./backend";
import { Frontend } from "./frontend";

import { Bus } from "./bus";

import { nameBase } from "./config";

const frontend = new Frontend(nameBase)
export const frontendUrl = frontend.url

const backend = new Backend(nameBase, {
  zone: "us-central1-a"
})

const pubsub = new Bus(nameBase)