import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { PolicyPack, validateResourceOfType } from "@pulumi/policy";

// PolicyPack that catches the case where an S3 bucket does not have a "BucketPublicAccessBlock" associated with it.
// The main policy of interest uses Stack Validation to figure out if a bucket is missing an access block. 
// Note that although Stack Validation enables checking values of resources that only exist after creation, 
// Stack Validation does run during preview as well and provides access to properties that are known before creation.
// So this is used to loop through each Bucket and for each bucket loop through the BucKetPublicAccessBlock resources to see if one references the bucket.

new PolicyPack("s3-accessblock", {
    policies: [
        {
            // This is just a simple test policy for the sake of seeing some output regardless if the main use-case is firing
            // a policy violation or not.
            // This policy is NOT needed.
            name: "test-policy",
            description: "A test policy that fires everytime.",
            enforcementLevel: "advisory",
            validateResource: validateResourceOfType(aws.s3.BucketV2, (bucket, args, reportViolation) => {
                reportViolation(
                    `TEST POLICY: (${args.name}) This is a test policy. You can ignore.`
                )
                }
            ),
        },
        {
            // Checks the stack config for a stack_name value and confirms it meets a given pattern
            name: "stack-name-config-check",
            description: "Checks that the stack_name config property meets the naming convention.",
            // enforcementLevel: "mandatory",
            enforcementLevel: "advisory",
            // Don't have to use validateStack - could use validateResource.
            // But then you have to have the given type of resource in the stack for the policy to run.
            validateStack: (stack, reportViolation) => {
                const stackConfig = new pulumi.Config()
                const configStackName = stackConfig.require("stack_name")
                // DEBUGGING STUFF:
                // console.log("configStackName", configStackName)
                const stackNameRegExp = new RegExp("teststack-*")
                if (!stackNameRegExp.test(configStackName)) {
                    reportViolation(`Stack name config: ${configStackName}, violates naming convention.`)
                }
            },
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
                    bucketAccessBlockFound = false
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

