import * as pulumi from "@pulumi/pulumi";
import * as awsnative from "@pulumi/aws-native";
import * as aws from "@pulumi/aws";
import { generateCanaryPolicy } from "./canaryPolicy"

const config = new pulumi.Config()
const baseName = config.get("baseName") || "canary"

// Bucket for storing canary scripts
const canaryScriptsBucket = new aws.s3.BucketV2(`${baseName}-scripts`)
// Bucket for storing canary results
const canaryResultsS3Bucket = new aws.s3.BucketV2(`${baseName}-results`, {
  forceDestroy: true
})



// Canary execution role
const canaryExecutionRole = new aws.iam.Role(`${baseName}-exec-role`, {
  assumeRolePolicy: {
      Version: "2012-10-17",
      Statement: [
          {
              Action: "sts:AssumeRole",
              Effect: "Allow",
              Principal: {
                  Service: "lambda.amazonaws.com",
              },
          },
      ],
  },
})

// Make sure the canary(lambda) can do what it needs to do just being a canary.
// Note though that if the canary code itself has to interact with AWS resources, then the role needs the 
// policies to allow the canary to do so.
// The canaries used in this example do not interact with any AWS resources, 
// so no canary-specific permissions are needed.
const canaryExecutionPolicy = new aws.iam.RolePolicy(`${baseName}-exec-policy`, {
  role: canaryExecutionRole.id,
  policy: canaryResultsS3Bucket.arn.apply(arn => generateCanaryPolicy(arn))
})

// zip up, upload and deploy the "simple canary"
const simpleCanaryScriptArchive = new pulumi.asset.FileArchive("./canaries/simple-canary/");
const simpleCanaryScriptObject = new aws.s3.BucketObjectv2(`${baseName}-simple-canary`, {
  bucket: canaryScriptsBucket.id,
  source: simpleCanaryScriptArchive,
}) 
// Create a canary using the AWS Classic provider.
const simpleCanary = new aws.synthetics.Canary(`${baseName}-simple`, {
    artifactS3Location: canaryResultsS3Bucket.id.apply(id => `s3://${id}`),
    executionRoleArn: canaryExecutionRole.arn,
    handler: "exports.handler",
    runtimeVersion: "syn-nodejs-puppeteer-3.5",
    schedule: {
        expression: "rate(1 minute)",
    },
    s3Bucket: canaryScriptsBucket.id,
    s3Key: simpleCanaryScriptObject.id,
    startCanary: true
}, {replaceOnChanges: ["s3Key"]});

// zip up and upload the "webpage canary"
const webpageCanaryScriptArchive = new pulumi.asset.FileArchive("./canaries/webpage-canary/");
const webpageCanaryScriptObject = new aws.s3.BucketObjectv2(`${baseName}-webpage-canary`, {
  bucket: canaryScriptsBucket.id,
  source: webpageCanaryScriptArchive,
}) 
// Create a canary using the AWS Native provider, because why not?
const webpageCanary = new awsnative.synthetics.Canary(`${baseName}-web`, {
  artifactS3Location: canaryResultsS3Bucket.id.apply(id => `s3://${id}`),
  executionRoleArn: canaryExecutionRole.arn,
  runtimeVersion: "syn-nodejs-puppeteer-3.5",
  schedule: {
      expression: "rate(1 minute)",
  },
  code: {
    handler: "exports.handler",
    s3Bucket: canaryScriptsBucket.id,
    s3Key: webpageCanaryScriptObject.id,
  },
  startCanaryAfterCreation: true
}, {replaceOnChanges: ["s3Key"]});
