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
            // This policy checks if a publicaccessblock is referencing a bucket's `id` property instead of `bucket` property
            // and throws an error if `id` is used (predeployment) and thus it is not known.
            name: "check-accessblock-bucket-reference",
            description: "Make sure BucketPublicAccessBlock \"bucket\" property is set to a bucket `bucket` property and not `id`.",
            // enforcementLevel: "mandatory",
            enforcementLevel: "advisory",
            validateResource: validateResourceOfType(aws.s3.BucketPublicAccessBlock, (publicAccessBlock, args, reportViolation) => {
                    // DEBUGGING STUFF:
                    // console.log("doing the property check", publicAccessBlock)
                    try {
                        // This is to cause the policy engine to throw an error if the bucket property is unknown 
                        // so it can be caught below.
                        let _ = publicAccessBlock.bucket
                    } catch {
                        reportViolation(
                            `*** ${args.name} ***\nBucketPublicAccessBlock.bucket field is not set to a \`BUCKET.bucket\` property.\nThe likely problem is that the field is being set to a \`BUCKET.id\`.\nChange to use \`BUCKET.bucket\` property instead.`
                        )
                    }
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
                    const bucketResourceName = bucket.props.bucket
                    // DEBUGGING STUFF:
                    // console.log("Bucket Found: ", bucketResourceName)
                    publicAccessBlocks.forEach(function (accessBlock) {
                        if (accessBlock.props.bucket == bucketResourceName) {
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
        // DEBUG: This policy is helpful to validate the policy engine is running as expected when not getting any output.
        // {
        //     name: "test policy",
        //     description: "Checks policies are running as expected",
        //     enforcementLevel: "advisory",
        //     validateResource: validateResourceOfType(aws.s3.BucketV2, (bucket, args, reportViolation) => {
        //             reportViolation(
        //                 "resource validation ran"
        //             )
        //         }
        //     ),
        // }
    ],
});

