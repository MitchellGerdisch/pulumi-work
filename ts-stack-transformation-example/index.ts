import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const config = new pulumi.Config();
// if the config parameter, "protect" is not set or is set to anything but "false", then assume protection should be on. I.e. err on the safe side.
// config.get("varname") will return an empty string if not set.
const protect = (config.get("protect") != "false"); 
// Some debugging output. Can be seen with pulumi up --debug
// https://www.pulumi.com/docs/intro/concepts/programming-model/#logging
pulumi.log.debug(`*** protect *** ${protect}`); 

// Here is a blog on the stack transformation capability: https://www.pulumi.com/blog/automatically-enforcing-aws-resource-tagging-policies/
// The blog example is related to tags and a bit more involved.
// This is a simpler example that focuses on setting the protect resource option across the stack.
// The way this works is that "args" references all the resources being created in the stack.
// Each "arg" has "props" (i.e. properties, i.e. the arguments passed to the declaration) and
// Each "arg" has "opts" (i.e. the resoruce options).
// The props and opts are indexed by their name.
// In this case, the resource option we care about is called "protect" - see https://www.pulumi.com/docs/intro/concepts/programming-model/#protect
// So in this case, we set/overwrite the "protect" option for each resource in the stack.
// Note if you change the config to be true or false, a pulumi up is needed to update the protect setting before trying to do the destroy.
pulumi.runtime.registerStackTransformation((args) => {
  args.opts["protect"] = protect
  return { props: args.props, opts: args.opts }
});

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("bucket");

// Export the name of the bucket
export const bucketName = bucket.id;
