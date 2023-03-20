import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

// Function to create a bucket and bucket object to store app code for a cloud function

export interface appBucketArgs {
  appPath: string;
  parent?: pulumi.Resource;
}

export interface appBucket {
  name: pulumi.Input<string>;
  fileName: pulumi.Input<string>;
}

export function createAppBucket(name: string, args: appBucketArgs): appBucket {
    const appBucket = new gcp.storage.Bucket(`${name}-bucket`, {
      location: "US"
    }, {parent: args.parent})

    const appFile = new gcp.storage.BucketObject(`${name}-file`, {
      bucket: appBucket.name,
      source: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive(args.appPath)
      })
    }, {parent: args.parent})

    return({
      name: appBucket.name,
      fileName: appFile.name
    })
  }