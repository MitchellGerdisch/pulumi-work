import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi"
import * as aws from "@pulumi/aws"
import * as s3bucket2 from "./s3bucket_2"

interface S3BucketArgs {
  acl?: Input<string>;
};

export class S3Bucket extends pulumi.ComponentResource {
    public readonly bucketId: Output<string>;
    public readonly bucket: aws.s3.Bucket;
    public readonly bucket2: s3bucket2.S3Bucket2;

    constructor(name: string, args: S3BucketArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:x:S3Bucket", name, args, opts);
        this.bucket = new aws.s3.Bucket(name, {
          acl: args.acl
        }, {parent: this})

        this.bucketId = this.bucket.id

        this.bucket2 = new s3bucket2.S3Bucket2(name, {}, {parent: this})
    }
  }