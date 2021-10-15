import * as pulumi from "@pulumi/pulumi"
import { Input, Output } from "@pulumi/pulumi";
import * as aws from "@pulumi/aws"

interface DocumentDbArgs {
  vpcId: Input<string>;
  subnetIds: Input<string>[] | Promise<Input<string>[]>;
  instanceClass: Input<string>;
  instanceCount: Input<number>;
  adminUserName: Input<string>;
  adminPassword: Input<string>;
};

export class DocumentDb extends pulumi.ComponentResource {

  constructor(name: string, args: DocumentDbArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:x:DocumentDb", name, args, opts);

    const vpcId = args.vpcId
    const subnetIds = args.subnetIds
    const instanceClass = args.instanceClass
    const instanceCount = args.instanceCount
    const adminUserName = args.adminUserName
    const adminPassword = args.adminPassword
    const nameBase = `${name}-docdb`

    const docDbSecurityGroup = new aws.ec2.SecurityGroup(`${nameBase}-sec-group`, {
      vpcId: vpcId,
      ingress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: [ "0.0.0.0/0" ],
        }
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: [ "0.0.0.0/0" ]
        }
      ]
    })

    const docDbSubnetGroup = new aws.docdb.SubnetGroup(`${nameBase}-subnet-group`, {
      subnetIds: subnetIds
    })

    const docDbClusterParameterGroup = new aws.docdb.ClusterParameterGroup(`${nameBase}-param-group`, {
      family: "docdb3.6",
      parameters: [
        {
          name: "tls",
          value: "disabled"
        }
      ]
    })

    const clusterName = `${nameBase}-cluster`
    const docDbCluster = new aws.docdb.Cluster(clusterName, {
      clusterIdentifier: clusterName,
      skipFinalSnapshot: true,
      dbSubnetGroupName: docDbSubnetGroup.name,
      engine: "docdb",
      masterUsername: adminUserName,
      masterPassword: adminPassword,
      dbClusterParameterGroupName: docDbClusterParameterGroup.name,
      vpcSecurityGroupIds: [ docDbSecurityGroup.id ]
    })

    for (let i = 0; i < instanceCount; i++) {
      const instanceName = `${nameBase}-instance-${i}`
      const clusterInstance = new aws.docdb.ClusterInstance(instanceName, {
        clusterIdentifier: docDbCluster.id,
        identifier: instanceName,
        instanceClass: instanceClass
      });
    }
    this.registerOutputs()
  }
}
