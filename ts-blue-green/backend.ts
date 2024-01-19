import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Interface for backend component inputs
export interface BackendArgs {
  indexDocumentFolder: string;
  indexDocumentName: string;
}

export interface BackendProperties {
  bucketName: pulumi.Output<string>;
  bucketArn: pulumi.Output<string>;
  bucketDomainName: pulumi.Output<string>;
}

// Creates Backend
export class Backend extends pulumi.ComponentResource {
  public readonly backendProperties = <BackendProperties>{}; 

  constructor(name: string, args: BackendArgs, opts?: pulumi.ComponentResourceOptions) {

    super("custom:resource:Backend", name, args, opts);

    const indexDocumentPath = `${args.indexDocumentFolder}/${args.indexDocumentName}`

    // Create an S3 bucket
    const bucket = new aws.s3.BucketV2(`${name}-bucket`, {
    }, {parent: this});

    const page = new aws.s3.BucketObjectv2(`${name}-page`, {
      bucket: bucket.id,
      key: "index.html",
      contentType: "text/html",
      source: new pulumi.asset.FileAsset(indexDocumentPath)
    }, {parent: this})

    this.backendProperties.bucketArn = bucket.arn
    this.backendProperties.bucketDomainName = bucket.bucketDomainName
    this.backendProperties.bucketName = bucket.bucket

    this.registerOutputs({});
  }
}

