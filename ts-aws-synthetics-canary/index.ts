import * as pulumi from "@pulumi/pulumi";
import * as awsnative from "@pulumi/aws-native";
import * as aws from "@pulumi/aws";

// Zip and upload the canary script
const canaryScriptAsset = new pulumi.asset.FileArchive("./canary");
const canaryScriptAssetArchive = new pulumi.asset.AssetArchive({
  file: canaryScriptAsset
})
const canaryScriptBucket = new aws.s3.BucketV2("mitch-canary-script-bucket")
const canaryScriptObject = new aws.s3.BucketObjectv2("mitch-canary-script", {
  bucket: canaryScriptBucket.id,
  source: canaryScriptAssetArchive
})

// Canary execution role
const canaryExecurtionRole = new aws.iam.Role("mitch-bird-role", {
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
  managedPolicyArns: [ "arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess"]
})

// Bucket for storing the canary results
const canaryResultsS3Bucket = new aws.s3.BucketV2("mitch-canary-results")

// Canary based on AWS Classic provider.
const myCanary = new aws.synthetics.Canary("mitch-bird", {
    artifactS3Location: canaryResultsS3Bucket.id.apply(id => `s3://${id}`),
    executionRoleArn: canaryExecurtionRole.arn,
    handler: "exports.handler",
    runtimeVersion: "syn-nodejs-puppeteer-3.5",
    schedule: {
        expression: "rate(1 minute)",
    },
    s3Bucket: canaryScriptBucket.id,
    s3Key: canaryScriptObject.id,
});

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

