import * as pulumi from "@pulumi/pulumi";
import { Output } from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

interface BackendArgs {
  zone: string;
  storageType?: string;
};


export class Backend extends pulumi.ComponentResource {
  public readonly tableName: Output<string>

  constructor(name: string, args: BackendArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:EventProcessor:Backend", name, args, opts);

    const nameBase = `${name}-be`
    const storageType = args?.storageType ?? "SSD"

    const clusterName = `${nameBase}-cluster`
    const backendTableCluster = new gcp.bigtable.Instance(clusterName, {
      clusters: [{
          clusterId: `${nameBase}-c1`,
          numNodes: 1,
          zone: args.zone,
          storageType: args.storageType,
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

    this.registerOutputs()
  }
}
