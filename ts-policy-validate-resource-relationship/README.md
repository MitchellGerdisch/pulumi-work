# Policy Pack example that validates inter-resource requirements
The specific use-case here is: 
* All S3 buckets need to have a BucketPublicAccessBlock associated with it.
* Violations of this need to be caught before resources are created (and after creation as well).

But this example touches on some concepts and approaches that would be applicable anytime such inter-resource dependency needs
to be validated via policy.

# Key Items of Note
* The `validateStack` type of policy is needed to be able to loop through the stack resources to find all the Buckets and then for each bucket to check if there are any BucketPublicAccessBlocks resources that reference it. 
* Although `validateStack` does give you access to post-creation properties, it does run during preview and does allow you to see pre-creation properties and dependencies.

# How to Use
* Copy both the `pulumi-project` and `policy-pack` folders.
* `cd pulumi-project`
* `pulumi stack init dev`

## Pre Deployment Testing
* `pulumi preview --policy-pack ../policy-pack`
* You should see policy violations for:  
  **NOTE NOTE NOTE**  
  You may not see all of these violations and may need to rerun the `pulumi preview --policy-pack` command a few times to see all the violations. This issue has been opened to track this: https://github.com/pulumi/pulumi-policy/issues/305  
  But, after repeated runs you should see these 3 violations.
  * `partlyCloudyBucketPublicAccessBlock`: Not referencing a bucket correctly.
  * `partlyCloudyBucket`: Missing a Public Access Block. 
    * This is because of the other violation about `partlyCloudBucketPublicAccessBlock`
  * `rainyDayBucket`: Missing a Public Access Block. 
    * This is because there is no Public Access Block declared for this bucket in the Pulumi program. 
    * This is the raison d`etre for this policy pack.

## Post Deployment Testing
* `pulumi up --policy-pack ../policy-pack`
  * You will see policy violations
* Response `y` to do the deployment.
* `pulumi preview --policy-pack ../policy-pack`
  * You should only see policy violation for the `rainyDayBucket`.
    * This is because the test for `partlyCloudyBucketPublicAccessBlock` passes now that the bucket has an `id` property.
  * Again, as per the note above, you may need to run the `pulumi preview` a couple of times to see the violation.
 