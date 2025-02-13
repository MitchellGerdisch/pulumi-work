import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as pulumicdk from '@pulumi/cdk';
import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3";
import * as fs from "fs";
import * as mime from "mime-types";

// Naming convention
const prefix = `${pulumi.getProject()}-${pulumi.getStack()}`;

// Define class that acts as a set of CDK and other Pulumi resources
class CloudFrontS3 extends pulumicdk.Stack {

  cloudFrontDomain: pulumi.Output<string>;

  constructor(app: pulumicdk.App, id: string, options?: pulumicdk.StackOptions) {
    super(app, id, options);

    // Create Cloudfront distro and website and logging buckts, etc using the L3 CDK construct
    const cloudfrontBucketInfra = new CloudFrontToS3(this, 'Website', {
      cloudFrontDistributionProps: {
        priceClass: 'PriceClass_100', // Limit to US, Mexico, Canada, Europe, etc (see https://aws.amazon.com/cloudfront/pricing/)
      }
    })
    // Get the domain name for the CloudFront distribution
    this.cloudFrontDomain = this.asOutput(cloudfrontBucketInfra.cloudFrontWebDistribution.distributionDomainName);

    // Get the name for the bucket that is set up to hold the website content.
    const websiteBucketName = this.asOutput(cloudfrontBucketInfra.s3Bucket!.bucketName);

    // Create an website objects in the bucket created by CDK construct above. 
    // For each file in the directory, create an S3 object stored in `siteBucket`
    const siteDir = "www";
    for (const item of fs.readdirSync(siteDir)) {
      const filePath = require("path").join(siteDir, item);
      const siteObject = new aws.s3.BucketObject(item, {
        bucket: websiteBucketName,                               // reference the s3.Bucket object
        source: new pulumi.asset.FileAsset(filePath),     // use FileAsset to point to a file
        contentType: mime.lookup(filePath) || undefined, // set the MIME type of the file
      });
    }
  }
}

// Define App class that uses the above Stack classes.
class MyApp extends pulumicdk.App {
  constructor() {
    super('app', (scope: pulumicdk.App) => {
        const stack = new CloudFrontS3(scope, `${prefix}-cf-s3`, {});
        return { cloudFrontDomain: stack.cloudFrontDomain };
    });
  }
}

// Instatiate the resources using the above class
const app = new MyApp();
export const cloudFrontUrl = pulumi.interpolate`https://${app.outputs['cloudFrontDomain']}`;


