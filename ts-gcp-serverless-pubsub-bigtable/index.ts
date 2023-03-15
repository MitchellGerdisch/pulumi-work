import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

import { Backend } from "./backend";
import { Bus } from "./bus";

import { nameBase } from "./config";

const backend = new Backend(nameBase, {
  zone: "us-central1-a"
})

const pubsub = new Bus(nameBase)