import * as pulumi from "@pulumi/pulumi";
import { Output } from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

interface FrontendArgs {
  appPath: string;
};


export class Frontend extends pulumi.ComponentResource {
  public readonly url: Output<string>

  constructor(name: string, args?: FrontendArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:EventProcessor:Frontend", name, args, opts);

    const nameBase = `${name}-fe`

    // Storage bucket for the cloud function code
    const frontendAppBucket = new gcp.storage.Bucket(`${nameBase}-bucket`, {
      location: "US"
    }, {parent: this})
    const frontendAppFile = new gcp.storage.BucketObject(`${nameBase}-file`, {
      bucket: frontendAppBucket.name,
      source: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./frontend-app")
      })
    }, {parent: this})

    const frontEndApp = new gcp.cloudfunctions.Function(`${nameBase}-function`, {
      entryPoint: "get_demo",
      runtime: "python37",
      sourceArchiveBucket: frontendAppBucket.name,
      sourceArchiveObject: frontendAppFile.name,
      triggerHttp: true
    }, {parent: this})

    const invoker = new gcp.cloudfunctions.FunctionIamMember(`${nameBase}-iam`, {
      project: frontEndApp.project,
      region: frontEndApp.region,
      cloudFunction: frontEndApp.name,
      role: "roles/cloudfunctions.invoker",
      member: "allUsers"
    }
      
  )

    this.url = pulumi.interpolate`${frontEndApp.httpsTriggerUrl}`

    this.registerOutputs()
  }
}
