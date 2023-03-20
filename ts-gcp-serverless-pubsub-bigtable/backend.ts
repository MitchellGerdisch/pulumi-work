import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

import { createAppBucket } from "./app-bucket";

interface BackendArgs {
  appPath: string;
  pubsubTopicName: Input<string>;
  pubsubTopicId: Input<string>;
  location: string;
};


export class Backend extends pulumi.ComponentResource {
  public readonly tableInstance: Output<string>
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

    this.tableInstance = backendTableCluster.name

    const tableName = `${nameBase}-table`
    const columnFamily = `${nameBase}-cf`
    const backendTable = new gcp.bigtable.Table(tableName, {
        instanceName: backendTableCluster.name,
        name: tableName,
        columnFamilies: [{family: columnFamily}],
        deletionProtection: "UNPROTECTED", // makes testing and demoing easier
    }, {parent: this});

    this.tableName = backendTable.name

    // Storage bucket for the backend cloud function code
    const backendAppBucket = createAppBucket(nameBase, {
      appPath: args.appPath,
      parent: this
    })

    // Function that reads pubsub and pushes to Bigtable
    const backendFunction = new gcp.cloudfunctions.Function(`${nameBase}-function`, {
      entryPoint: "process_pubsub_event",
      runtime: "python38",
      sourceArchiveBucket: backendAppBucket.name,
      sourceArchiveObject: backendAppBucket.fileName,
      eventTrigger: {
        eventType: "providers/cloud.pubsub/eventTypes/topic.publish", // https://cloud.google.com/eventarc/docs/cloudevents#pubsub_1
        resource: args.pubsubTopicId,
      },
      environmentVariables: {
        "GOOGLE_PROJECT_ID": gcp.config.project,
        "BIGTABLE_INSTANCE_ID": backendTableCluster.name,
        "BIGTABLE_TABLE_ID": backendTable.name,
        "BIGTABLE_COLUMN_FAMILY": columnFamily,
      }
    }, {parent: this})

    this.registerOutputs()
  }
}
