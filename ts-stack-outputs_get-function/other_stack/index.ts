 // Contrived example around using:
 // - StackReference outputs as inputs to a
 // - GET function 
 // - and then using the results of that GET function as inputs to another resource creation.


import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { getBucketObject } from "@pulumi/gcp/storage";

// get stack outputs
const config = new pulumi.Config()
const stackName = config.require("stackName")
const baseStack = new pulumi.StackReference(stackName)
export const bucketName = baseStack.getOutput("bucketName")
export const bucketObjectName = baseStack.getOutput("bucketObjectName")


// Use .all()/.apply() methods to resolve the stack outputs before calling the function
const bktObject = pulumi.all([bucketName, bucketObjectName]).apply(([name, id]) => {
  return getBucketObject({
    bucket:  name,
    name: id,
  });
});

// use the function output for a resource creation
const anotherBucketObject = new gcp.storage.BucketObject("another-object", {
  bucket: pulumi.interpolate`${bktObject.bucket}`, // interpolate is used "convert" the Output<string> to string.
  content: "This is another bucket object"
});



