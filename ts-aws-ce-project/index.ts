// TODOs:
// - documentdb resource
// - app and ingress on eks that talks to documentdb

// NEW PLAN:
// Let's build this: https://geekrodion.medium.com/amazon-documentdb-and-aws-lambda-with-terraform-34a5d1061c15
// And then figure out how to fold the eks-fargate cluster into it.

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { DocumentDb } from "./document-db"
import * as eks from "@pulumi/eks";
import { ConfigData, getConfigData } from "./utils/config"
import { IngressCtl } from "./ingress-ctl"

const configData = getConfigData()
const nameBase = configData.nameBase
const appNamespaceName = `${nameBase}-app`
const albControllerNamespaceName = `${nameBase}-aws-lb-controller`
const sysNamespaceName = "kube-system" // the system namespace where things like coredns ru

// Use the awsx package to create the VPC and related resources (e.g. subnets, IGWs, etc).
// See: https://www.pulumi.com/docs/reference/pkg/nodejs/pulumi/awsx/ec2/
const vpcName = `${nameBase}-vpc`
const vpc = new awsx.ec2.Vpc(vpcName, {
  cidrBlock: configData.vpcCidrBlock,
  numberOfAvailabilityZones: configData.vpcNumAvailZones,
  tags: {
    "Name": vpcName
  }
})

const docDb = new DocumentDb(`${nameBase}`, {
  vpcId: vpc.id,
  subnetIds: vpc.privateSubnetIds,
  instanceClass: configData.docDbInstanceClass,
  instanceCount: configData.docDbInstanceCount,
  adminUserName: configData.docDbUser,
  adminPassword: configData.docDbPassword,
})


////////// IGNORING EKS FOR NOW ////////////
// // Create eks cluster using fargate pods
// const cluster = new eks.Cluster(`${nameBase}-eks`, {
//   fargate: {
//     selectors: [{namespace: appNamespaceName}, {namespace: sysNamespaceName}, {namespace: albControllerNamespaceName}]
//   },
//   vpcId: vpc.id,
//   privateSubnetIds: vpc.privateSubnetIds,
//   createOidcProvider: true
// })
// // export (secretly) the kubeconfig in case user wants to use kubectl
// export const kubeconfig = pulumi.secret(cluster.kubeconfig)
// // create k8s provider for subsequent updates to the EKS cluster.
// const k8sProvider = cluster.provider

// // INGRESS Controller 
// // Deploy the aws alb ingress controller and any related bits
// const ingressController = new IngressCtl(`${nameBase}`, {
//   k8sProvider: k8sProvider,
//   clusterName: cluster.core.cluster.name,
//   oidcProviderArn: cluster.core.oidcProvider?.arn, //|| "oidcprovider arn not found",
//   oidcProviderUrl: cluster.core.oidcProvider?.url, //|| "oidcprovider url not found",
//   namespaceName: albControllerNamespaceName,
//   vpcId: cluster.core.vpcId,
//   awsRegion: configData.region
// })

