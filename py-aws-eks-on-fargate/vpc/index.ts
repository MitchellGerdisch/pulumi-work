import * as pulumi from "@pulumi/pulumi";
import Vpc from './vpc';

const projName = pulumi.getProject();
// basic call to vpc module and exporting what it exports
const vpc = new Vpc(projName, {
  
});

export const vpcId = vpc.id
export const privateSubnetIds = vpc.privateSubnetIds
export const publicSubnetIds = vpc.publicSubnetIds

