import * as pulumi from "@pulumi/pulumi";
import * as awsnative from "@pulumi/aws-native";
import * as aws from "@pulumi/aws";
import { generateCanaryPolicy } from "./canaryPolicy"

const config = new pulumi.Config()
const baseName = config.get("baseName") || "canary"

// Zip and upload the canary script
// const canaryScriptAsset = new pulumi.asset.FileArchive("./canary/Canary.zip");
// const canaryScriptBucket = new aws.s3.BucketV2(`${baseName}-scripts`)
// const canaryScriptObject = new aws.s3.BucketObjectv2(`${baseName}-test-script`, {
//   bucket: canaryScriptBucket.id,
//   source: canaryScriptAsset
// }, {replaceOnChanges: ["source"]})



const canaryScriptArchive = new pulumi.asset.FileArchive("./canary/");
// const canaryScriptAsset = new pulumi.asset.FileArchive("./canary/nodejs");
// const canaryScriptAssetArchive = new pulumi.asset.AssetArchive({
//   file: canaryScriptAsset
// })
const canaryScriptBucket = new aws.s3.BucketV2(`${baseName}-scripts`)
const canaryScriptObject = new aws.s3.BucketObjectv2(`${baseName}-test-script`, {
  bucket: canaryScriptBucket.id,
  source: canaryScriptArchive,
}, {replaceOnChanges: ["source"]}) // forces the canary to be updated when the code changes.

// Bucket for storing the canary results
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
  // managedPolicyArns: [ "arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess"]
})

const canaryExecutionPolicy = new aws.iam.RolePolicy(`${baseName}-exec-policy`, {
  role: canaryExecutionRole.id,
  policy: canaryResultsS3Bucket.arn.apply(arn => generateCanaryPolicy(arn))
})


// Canary based on AWS Classic provider.
const myCanary = new aws.synthetics.Canary(`${baseName}`, {
    artifactS3Location: canaryResultsS3Bucket.id.apply(id => `s3://${id}`),
    executionRoleArn: canaryExecutionRole.arn,
    handler: "exports.handler",
    runtimeVersion: "syn-nodejs-puppeteer-3.5",
    schedule: {
        expression: "rate(1 minute)",
    },
    s3Bucket: canaryScriptBucket.id,
    s3Key: canaryScriptObject.id,
}, {replaceOnChanges: ["s3Key"]});

// // Canary based on AWS Native provider.
// const myCanaryNative = new awsnative.synthetics.Canary("mitch-bird2", {
//   artifactS3Location: canaryResultsS3Bucket.id.apply(id => `s3://${id}`),
//   executionRoleArn: canaryExecurtionRole.arn,
//   runtimeVersion: "syn-nodejs-puppeteer-3.5",
//   schedule: {
//       expression: "rate(1 minute)",
//   },
//   code: {
//     handler: "exports.handler",
//     s3Bucket: canaryScriptBucket.id,
//     s3Key: canaryScriptObject.id,
//   },
//   startCanaryAfterCreation: false
// });

