import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

import { createAppBucket } from "./app-bucket";

interface FrontendArgs {
  appPath: string;
  topicName: Input<string>;
};

export class Frontend extends pulumi.ComponentResource {
  public readonly url: Output<string>

  constructor(name: string, args: FrontendArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:EventProcessor:Frontend", name, args, opts);

    const nameBase = `${name}-fe`

    // Storage bucket for the cloud function code
    const frontendAppBucket = createAppBucket(nameBase, {
      appPath: args.appPath,
      parent: this
    })

    const frontEndApp = new gcp.cloudfunctions.Function(`${nameBase}-function`, {
      entryPoint: "demo",
      runtime: "python37",
      sourceArchiveBucket: frontendAppBucket.name,
      sourceArchiveObject: frontendAppBucket.fileName,
      triggerHttp: true,
      environmentVariables: {
        "GOOGLE_PROJECT_ID": gcp.config.project,
        "TOPIC_NAME": args.topicName
      }
    }, {parent: this})

    const invoker = new gcp.cloudfunctions.FunctionIamMember(`${nameBase}-iam`, {
      project: frontEndApp.project,
      region: frontEndApp.region,
      cloudFunction: frontEndApp.name,
      role: "roles/cloudfunctions.invoker",
      member: "allUsers"
    }, {parent: this})

    this.url = pulumi.interpolate`${frontEndApp.httpsTriggerUrl}`

    this.registerOutputs()
  }
}
