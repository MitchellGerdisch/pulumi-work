import * as docker from "@pulumi/docker";
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

// Build and push image to gcr repository
const imageName = "hello-world";

const myImage = new docker.Image(imageName, {
    imageName: pulumi.interpolate`gcr.io/${gcp.config.project}/${imageName}:latest`,
    build: {
        context: "./app",
    },
});

// Digest exported so it's easy to match updates happening in cloud run project
export const gcrImageDigest = myImage.imageName
