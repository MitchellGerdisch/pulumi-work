import * as pulumi from "@pulumi/pulumi";
import * as ccapi from "@pulumi/aws-native";
import * as pulumicdk from '@pulumi/cdk';
import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3";


// Define class that acts as a set of CDK and other Pulumi resources
class CloudFrontS3 extends pulumicdk.Stack {

  cloudFrontDomain: pulumi.Output<string>;
  websiteBucketName: pulumi.Output<string>;

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
    this.websiteBucketName = this.asOutput(cloudfrontBucketInfra.s3Bucket!.bucketName);

  }
}

// Define App class that uses the above Stack classes.
export class CloudFrontS3Deployment extends pulumicdk.App {
  constructor(prefix: string) {
    super('cloudfronts3deployment', (scope: pulumicdk.App) => {
        const stack = new CloudFrontS3(scope, `${prefix}-cf-s3`, {});
        return { 
          cloudFrontDomain: stack.cloudFrontDomain,
          websiteBucketName: stack.websiteBucketName
        };
    }, 
  );
  }
}
