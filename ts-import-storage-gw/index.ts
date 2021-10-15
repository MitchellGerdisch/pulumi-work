import * as aws from "@pulumi/aws";

/*
 * This is an example of importing an AWS storage gateway and related components such as the gateway instance and S3 bucket 
 * so as to be under Pulumi management.
 *
 * TROUBLESHOOTING
 * Note: if you are missing a required property for the import, calling pulumi preview will show the missing parameter.
 * For example, if you see something like this:
 *******
       Type                 Name                   Plan       Info
     pulumi:pulumi:Stack  import-storage-gw-dev             
 =   └─ aws:ec2:Instance  my-imported-instance   import     [diff: -ebsOptimized,tags]; 1 warning
 
Diagnostics:
  aws:ec2:Instance (my-imported-instance):
    warning: inputs to import do not match the existing resource; importing this resource will fail
 ******
 * The [diff:] under Info is indicating that ebsOptimized and tags are needed to successfully import.
 */

// Refer to https://www.pulumi.com/docs/reference/pkg/nodejs/pulumi/aws/storagegateway/#GatewayArgs 
export const myImportedStorageGw = new aws.storagegateway.Gateway("my-imported-storage-gw", {
    gatewayName: "mitch-storage-gw-3", // remove the parenthetical stuff at the end of the name in AWS console: e.g.  (sgw-8DCF2CE4)",
    gatewayTimezone: "GMT-6:00", // copied from AWS console
    gatewayType: "FILE_S3", // allowed values found here: https://www.pulumi.com/docs/reference/pkg/nodejs/pulumi/aws/storagegateway/#GatewayArgs-gatewayType
}, {import: "arn:aws:storagegateway:us-east-1:123455666:gateway/sgw-8DCF2CE4"}) // ARN copied from AWS console


// Refer to https://www.pulumi.com/docs/reference/pkg/aws/ec2/instance/#inputs for properties
// These are values that were already set for the instance I am importing (e.g. the Name tag was already set).
// Once imported, you can make changes, e.g. adding another tag.
export const myImportedInstance = new aws.ec2.Instance("my-imported-instance", {
    instanceType: "t3.2xlarge", // instance Type - as copied from AWS console
    ami: "ami-0056d3b3567a0b634", // AMI - as copied from AWS console
    ebsOptimized: true,  // setting as seen in storage view in AWS console
    tags: { // Existing tags as seen in AWS console
        "Name": "mitch-storage-gw-instance-3"
    }
}, { import:"i-0956a73c34608d1f2" }); // instance ID - as copied from AWS console

// bucket import
export const bucket = new aws.s3.Bucket(
    'my-imported-bucket',
    { bucket: 'mitch-storage-gw-bucket'}, // bucket name as seen in AWS console
    { import: 'mitch-storage-gw-bucket'} // bucket name as seen in AWS console
  );
