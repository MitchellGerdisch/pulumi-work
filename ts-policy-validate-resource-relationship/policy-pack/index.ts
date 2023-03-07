import * as aws from "@pulumi/aws";
import { PolicyPack, validateResourceOfType } from "@pulumi/policy";

// PolicyPack that catches the case where an S3 bucket does not have a "BucketPublicAccessBlock" associated with it.
// The main policy of interest uses Stack Validation to figure out if a bucket is missing an access block. 
// Note that although Stack Validation enables checking values of resources that only exist after creation, 
// Stack Validation does run during preview as well and provides access to properties that are known before creation.
// So this is used to loop through each Bucket and for each bucket loop through the BucKetPublicAccessBlock resources to see if one references the bucket.
// 
// HOWEVER, for this to work, the BucketPublicAccessBlock resource must reference the bucket via the bucket's `bucket` property
// instead of using the bucket's `id` field since `id` is not known predeployment.
// Thus there are policies in place to enforce this.

new PolicyPack("s3-accessblock", {
    policies: [
        {
            // This is just a simple test policy for the sake of seeing some output regardless if the main use-case is firing
            // a policy violation or not.
            // This policy is NOT needed.
            name: "test-policy",
            description: "A test policy that fires everytime.",
            enforcementLevel: "advisory",
            validateResource: validateResourceOfType(aws.s3.BucketPublicAccessBlock, (publicAccessBlock, args, reportViolation) => {
                reportViolation(
                    "TEST POLICY: This is a test policy. You can ignore."
                )
                }
            ),
        },
        {
            name: "bucket-has-access-block",
            description: "Checks if S3 bucket has an access block defined",
            // enforcementLevel: "mandatory",
            enforcementLevel: "advisory",
            validateStack: (stack, reportViolation) => {
                let bucketAccessBlockFound = false
                const buckets = stack.resources.filter((resource) => resource.isType(aws.s3.BucketV2));
                const publicAccessBlocks = stack.resources.filter((resource) => resource.isType(aws.s3.BucketPublicAccessBlock))
                // DEBUGGING STUFF:
                // console.log(buckets)
                // console.log(publicAccessBlocks)
                buckets.forEach(function (bucket) {
                    const bucketResourceUrn = bucket.urn
                    publicAccessBlocks.forEach(function (accessBlock) {
                        // DEBUGGING STUFF:
                        // console.log("Access Block Found: ", accessBlock.name)
                        // console.log("propertyDependencies", accessBlock.propertyDependencies)
                        // Since an access block only supports a single bucket reference, 
                        // it'll always be the first element of the propertyDependencies.bucket property array.
                        if (accessBlock.propertyDependencies.bucket[0].urn == bucketResourceUrn) { 
                            bucketAccessBlockFound = true
                        }
                    })
                    if (!bucketAccessBlockFound) {
                        reportViolation(
                            `*** ${bucket.name} ***\nBucket is missing a Public Access Block`
                        );
                    }
                })
            },
        },
    ],
});

