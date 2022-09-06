import * as docker from "@pulumi/docker";
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import * as pulumiService from "@pulumi/pulumiService";

// Build and push image to gcr repository
const imageName = "hello-world";

const myImage = new docker.Image(imageName, {
    imageName: pulumi.interpolate`gcr.io/${gcp.config.project}/${imageName}:latest`,
    build: {
        context: "./app",
    },
});

const stackTag = new pulumiService.StackTag("stackTag", {
    organization: pulumi.getOrganization(),
    project: pulumi.getProject(),
    stack: pulumi.getStack(),
    name: "Demo",
    value: "GCR-CloudRun-CloudFunction"
})

// Digest exported so it's easy to match updates happening in cloud run project
export const gcrImageDigest = myImage.imageName
