import * as pulumi from "@pulumi/pulumi";
import { ComponentResource, ComponentResourceOptions, Input, Output } from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as gcloud from "@pulumi/google-native";

export interface CloudFunctionArgs{
};

export class CloudFunction extends ComponentResource {
  public readonly functionUrl: Output<string>;

  constructor(name: string, args?: CloudFunctionArgs, opts?: ComponentResourceOptions) {
    super("custom:x:CloudFunction", name, args, opts);

    const bucket = new gcloud.storage.v1.Bucket(`${name}-bucket`, {}, {parent: this})

    const bucketObject = new gcloud.storage.v1.BucketObject(`${name}-zip`, {
        bucket: bucket.name,
        source: new pulumi.asset.AssetArchive({
            ".": new pulumi.asset.FileArchive("./pythonfunc"),
        }),
    }, {parent: this});

    const func = new gcloud.cloudfunctions.v1.Function(`${name}-function`, {
        sourceArchiveUrl: pulumi.interpolate`gs://${bucket.name}/${bucketObject.name}`,
        httpsTrigger: {},
        entryPoint: "handler",
        timeout: "60s",
        availableMemoryMb: 128,
        runtime: "python37",
        ingressSettings: "ALLOW_ALL",
    }, {parent: this});

    const invoker = new gcloud.cloudfunctions.v1.FunctionIamPolicy(`${name}-function-iam`, {
        functionId: func.name.apply(name => name.split("/")[name.split("/").length-1]),
        bindings: [
            {
                members: ["allUsers"],
                role: "roles/cloudfunctions.invoker",
            },
        ],
    }, { dependsOn: func, parent: this});

    this.functionUrl = func.httpsTrigger.url;
  }
}