import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Sunny Day case: Bucket has an access block.
const sunnyDayBucket = new aws.s3.BucketV2("sunnyDayBucket", {});
const sunnyDayBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock("sunnyDayBucketPublicAccessBlock", {
    bucket: sunnyDayBucket.bucket,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// This set of resources is the main use-case being tested.
// A bucket is created WITHOUT a BucketPublicAccessBlock associated with it.
const rainyDayBucket = new aws.s3.BucketV2("rainyDayBucket", {});