# Policy Pack example that validates inter-resource requirements
The specific use-case here is: 
* All S3 buckets need to have a BucketPublicAccessBlock associated with it.
* Violations of this need to be caught before resources are created (and after creation as well).

But this example touches on some concepts and approaches that would be applicable anytime such inter-resource dependency needs
to be validated via policy.

# Key Items of Note
* The `validateStack` type of policy is needed to be able to loop through the stack resources to find all the Buckets and then for each bucket to check if there are any BucketPublicAccessBlocks resources that reference it. 
  * Although `validateStack` does give you access to post-creation properties, it does run during preview and does allow you to see pre-creation properties.
* However, when creating a `BucketPublicAccessBlock` one can reference the bucket via `bucket` or `id` - they both work. But `id` is not known pre-deployment and 
  * So this then requires some policies to enforce people to use the `bucket` property but also allow for the post-creation case where `id` is used.
