# Policy Pack example that validates inter-resource requirements and validates config
The specific use-case here is: 
* All S3 buckets need to have a BucketPublicAccessBlock associated with it.
* Violations of this need to be caught before resources are created (and after creation as well).

But this example touches on some concepts and approaches that would be applicable anytime such inter-resource dependency needs
to be validated via policy.

It also checks the stack config.

# Key Items of Note
* The `validateStack` type of policy is needed to be able to loop through the stack resources to find all the Buckets and then for each bucket to check if there are any BucketPublicAccessBlocks resources that reference it. 
* Although `validateStack` does give you access to post-creation properties, it does run during preview and does allow you to see pre-creation properties and dependencies. This fact is used to check for relationships and config settings.

# How to Use
* Copy both the `pulumi-project` and `policy-pack` folders.
* `cd pulumi-project`
* `pulumi stack init dev`
* `pulumi config set stack_name test-dev`

## Pre Deployment Testing
* `pulumi preview --policy-pack ../policy-pack`
* You should see some test policy violations you can ignore and the violation for:  
  * `rainyDayBucket`: Missing a Public Access Block. 
    * This is because there is no Public Access Block declared for this bucket in the Pulumi program. 
    * This is the raison d`etre for this policy pack.

**NOTE** Due to this issue, https://github.com/pulumi/pulumi-policy/issues/305, you may need to run the command a few times to see the violation.

## Post Deployment Testing
* `pulumi up --policy-pack ../policy-pack`
  * You will see policy violations
* Response `y` to do the deployment.
* `pulumi preview --policy-pack ../policy-pack`
  * You should still see policy violation for the `rainyDayBucket`.  
    As per the note above, you may need to run the command a few times to see the policy violation.
 
