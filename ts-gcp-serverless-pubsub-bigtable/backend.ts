import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

interface BackendArgs {
  appPath: string;
  pubsubTopicName: Input<string>;
  pubsubTopicId: Input<string>;
  location: string;
};


export class Backend extends pulumi.ComponentResource {
  public readonly tableName: Output<string>

  constructor(name: string, args: BackendArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:EventProcessor:Backend", name, args, opts);

    const nameBase = `${name}-be`

    const clusterName = `${nameBase}-cluster`
    const backendTableCluster = new gcp.bigtable.Instance(clusterName, {
      clusters: [{
          clusterId: `${nameBase}-c1`,
          numNodes: 1,
          zone: args.location,
          storageType: "SSD"
      }],
      displayName: clusterName,
      name: clusterName,
      deletionProtection: false, // makes testing and demoing easier
    }, {parent: this});

    const tableName = `${nameBase}-table`
    const backendTable = new gcp.bigtable.Table(tableName, {
        instanceName: backendTableCluster.name,
        name: tableName,
        deletionProtection: "UNPROTECTED", // makes testing and demoing easier
    }, {parent: this});

    this.tableName = backendTable.name


    // Storage bucket for the backend cloud function code
    // DRY TODO: This is identical to frontend code so move into a function 
    const backendAppBucket = new gcp.storage.Bucket(`${nameBase}-bucket`, {
      location: "US"
    }, {parent: this})
    const backendAppFile = new gcp.storage.BucketObject(`${nameBase}-file`, {
      bucket: backendAppBucket.name,
      source: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive(args.appPath)
      })
    }, {parent: this})

    // // const backendFunction = new gcp.cloudfunctionsv2.Function("function", {
    // //   location: gcp.config.region,
    // //   // project: gcp.config.project,
    // //   buildConfig: {
    // //       runtime: "nodejs12",
    // //       entryPoint: "helloPubSub",
    // //       environmentVariables: {
    // //           BUILD_CONFIG_TEST: "build_test",
    // //       },
    // //       source: {
    // //           storageSource: {
    // //               bucket: backendAppBucket.name,
    // //               object: backendAppFile.name,
    // //           },
    // //       },
    // //   },
    // //   // serviceConfig: {
    // //   //     maxInstanceCount: 2,
    // //   //     minInstanceCount: 1,
    // //   //     availableMemory: "256M",
    // //   //     timeoutSeconds: 60,
    // //   //     environmentVariables: {
    // //   //         SERVICE_CONFIG_TEST: "config_test",
    // //   //     },
    // //   //     ingressSettings: "ALLOW_INTERNAL_ONLY",
    // //   //     allTrafficOnLatestRevision: true,
    // //   //     serviceAccountEmail: account.email,
    // //   // },
    // //   eventTrigger: {
    // //       triggerRegion: gcp.config.region,
    // //       eventType: "google.cloud.pubsub.topic.v1.messagePublished", // https://cloud.google.com/eventarc/docs/cloudevents#pubsub_1
    // //       pubsubTopic: args.pubsubTopic,
    // //       retryPolicy: "RETRY_POLICY_RETRY",
    // //   }
    // // }, {parent: this})

    const backendFunction = new gcp.cloudfunctions.Function(`${nameBase}-function`, {
      entryPoint: "process_pubsub_event",
      runtime: "python37",
      sourceArchiveBucket: backendAppBucket.name,
      sourceArchiveObject: backendAppFile.name,
      eventTrigger: {
        eventType: "providers/cloud.pubsub/eventTypes/topic.publish", // https://cloud.google.com/eventarc/docs/cloudevents#pubsub_1
        resource: args.pubsubTopicId,
      },
      environmentVariables: {
        "GOOGLE_PROJECT_ID": gcp.config.project,
        "BIGTABLE_INSTANCE_ID": backendTableCluster.id,
        "BIGTABLE_TABLE_ID": backendTable.id
      }
    }, {parent: this})

    this.registerOutputs()
  }
}
