import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// This first set of resources demonstrate the situation where
// sunnyDayBucket bucket resource is created and 
// sunnyDayBucketPublicAccessBlock references it "correctly" using the bucket's "bucket" property instead of the "id" property.
// In other words, no policies should fire for these two resources.
const sunnyDayBucket = new aws.s3.BucketV2("sunnyDayBucket", {});
const sunnyDayBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock("sunnyDayBucketPublicAccessBlock", {
    bucket: sunnyDayBucket.bucket,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// This set of resources is to validate the case where a BucketPublicAccessBlock resource is created but references
// the bucket's "id" property instead of the "bucket" property.
const partlyCloudyBucket = new aws.s3.BucketV2("partlyCloudyBucket", {});
const partlyCloudyBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock("partlyCloudyBucketPublicAccessBlock", {
  bucket: sunnyDayBucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});

// This set of resources is the main use-case being tested.
// A bucket is created WITHOUT a BucketPublicAccessBlock being created.
const rainyDayBucket = new aws.s3.BucketV2("rainyDayBucket", {});