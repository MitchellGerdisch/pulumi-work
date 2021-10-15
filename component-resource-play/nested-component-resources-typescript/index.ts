import * as pulumi from "@pulumi/pulumi";
import * as s3bucket from "./s3bucket"

// Create an AWS resource (S3 Bucket)
const bucket = new s3bucket.S3Bucket("my-bucket", {});

// Export the name of the bucket
export const bucketName = bucket.bucketId
export const bucket2Name = bucket.bucket2.bucketId
