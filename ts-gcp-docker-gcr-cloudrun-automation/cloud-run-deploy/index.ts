import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { CloudFunction } from "./cloudFunction";

const location = gcp.config.region || "us-central1";

const config = new pulumi.Config();

const imageStack = `${pulumi.getOrganization()}/${config.require("imageStackName")}/${pulumi.getStack()}`
const imageStackRef = new pulumi.StackReference(imageStack)
const dockerImageName = imageStackRef.requireOutput("gcrImageDigest")

// Deploy to Cloud Run if there is a difference in the sha, denoted above.  
const service = new gcp.cloudrun.Service("cloudrun", {
    location,
    template: {
        spec: {
            containers: [{
                image: dockerImageName
            }]
        },
    },
})

// Open the service to public unrestricted access
const iam = new gcp.cloudrun.IamMember("cloudrun-everyone", {
    service: service.name,
    location,
    role: "roles/run.invoker",
    member: "allUsers",
});

const helloWorldFunction = new CloudFunction("hello")

export const serviceUrl = service.statuses[0].url;
export const functionUrl = helloWorldFunction.functionUrl;

