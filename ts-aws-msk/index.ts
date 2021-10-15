import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { StandardVpc } from "./vpc";


const nameBase = "lambda-msk"
const vpcCidr = "10.0.0.0/16"
const az1SubnetCidr = "10.0.1.0/24"
const az2SubnetCidr = "10.0.2.0/24"

const config = new pulumi.Config("aws");
const reg = config.require("region") 

const vpc = new StandardVpc(`${nameBase}`, {
  vpcCidr: vpcCidr,
  subnetCidrBlocks: ["10.0.1.0/24", "10.0.2.0/24"],
  region: reg
})

export const msk = new aws.msk.Cluster(`${nameBase}-msk`, {
  brokerNodeGroupInfo: {
    clientSubnets: vpc.subnets,
    ebsVolumeSize: 5,
    instanceType: "kafka.t3.small",
    securityGroups: vpc.sgs,
  },
  kafkaVersion: "2.2.1",
  numberOfBrokerNodes: 2,
  clusterName: `${nameBase}-msk`
})
