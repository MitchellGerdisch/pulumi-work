import * as pulumi from "@pulumi/pulumi";
import * as awsnative from "@pulumi/aws-native";
import * as aws from "@pulumi/aws";

const canaryScriptAsset = new pulumi.asset.FileArchive("./canary");
const canaryScriptAssetArchive = new pulumi.asset.AssetArchive({
  file: canaryScriptAsset
})
const canaryScriptBucket = new aws.s3.Bucket("mitch-canary-script-bucket")
const canaryScriptObject = new aws.s3.BucketObject("mitch-canary-script", {
  bucket: canaryScriptBucket,
  source: canaryScriptAssetArchive
})

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

const canaryResultsS3Bucket = new aws.s3.Bucket("mitch-canary-results")

const myCanary = new aws.synthetics.Canary("mitch-bird", {
    artifactS3Location: canaryResultsS3Bucket.id.apply(id => `s3://${id}`),
    executionRoleArn: canaryExecurtionRole.arn,
    handler: "exports.handler",
    runtimeVersion: "syn-nodejs-puppeteer-3.5",
    schedule: {
        expression: "rate(1 minute)",
    },
    s3Bucket: canaryScriptBucket.id.apply(id => id),
    s3Key: canaryScriptObject.id.apply(id => id)
});
