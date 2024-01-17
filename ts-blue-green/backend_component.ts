import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";


// Interface for backend args
export interface BackendArgs {
  indexDocumentPath: string 
}

export interface BackendProperties {
  bucketDomainName: pulumi.Output<string>;
  bucketArn: pulumi.Output<string>;
}

// Creates DB
export class Backend extends pulumi.ComponentResource {
  public readonly backendProperties = <BackendProperties>{}; 

  constructor(name: string, args: BackendArgs, opts?: pulumi.ComponentResourceOptions) {

    super("custom:resource:Backend", name, args, opts);

    // Create an S3 bucket
    const bucket = new aws.s3.Bucket(`${name}-bucket`, {
      website: {
          indexDocument: args.indexDocumentPath,
      },
    }, {parent: this});

    const originAccess = new aws.cloudfront.OriginAccessControl(`${name}-oac`, {
        description: "Access control for backend bucket",
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
    }, { parent: this });

    // Create a CloudFront distribution that points to the active S3 bucket
    const distribution = new aws.cloudfront.Distribution(`${name}-distribution`, {
      origins: [{
          domainName: bucket.bucketRegionalDomainName,
          originId: bucket.arn,
          originAccessControlId: originAccess.id,
      }],
      enabled: true,
      isIpv6Enabled: true,
      defaultRootObject: "index.html",
      defaultCacheBehavior: {
          allowedMethods: ["GET", "HEAD"],
          cachedMethods: ["GET", "HEAD"],
          targetOriginId: bucket.arn,
          forwardedValues: {
              queryString: false,
              cookies: {
                  forward: "none",
              },
          },
          viewerProtocolPolicy: "redirect-to-https",
          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
      },
      priceClass: "PriceClass_100",
      customErrorResponses: [{
          errorCode: 404,
          responsePagePath: "/404.html",
          responseCode: 404,
          errorCachingMinTtl: 300,
      }],
      restrictions: {
          geoRestriction: {
              restrictionType: "none",
          }
      },
      viewerCertificate: {
          cloudfrontDefaultCertificate: true,
      },
    }, { parent: this });

    // Create an S3 Bucket Policy to allow public read of all objects
    let bucketPolicy = new aws.s3.BucketPolicy(`${name}-bucket-policy`, {
      bucket: bucket.bucket, // reference to the bucket created earlier
      policy: pulumi.all([bucket.arn, distribution.arn]).apply(([bucketArn, distrbutionArn]) => JSON.stringify({
          Version: "2012-10-17",
          Statement: [{
              Effect: "Allow",
              Principal: "*",
              Action: [
                  "s3:GetObject"
              ],
              Resource: [
                  `${bucketArn}/*` // policy refers to bucket name explicitly
              ],
              Condition: {
                "StringEquals": {
                    "AWS:SourceArn": distrbutionArn
                }
              }
          }]
        })
      ),
    }, {parent: this})

    this.backendProperties.bucketArn = bucket.arn
    this.backendProperties.bucketDomainName = bucket.bucketRegionalDomainName

    this.registerOutputs({});
  }
}
