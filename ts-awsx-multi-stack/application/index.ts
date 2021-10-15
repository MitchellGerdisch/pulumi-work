import {Output, Config, StackReference} from '@pulumi/pulumi';
import * as awsx from '@pulumi/awsx';

import Vpc from '../network/vpc';
import LoadBalancer from './load-balancer';

const config = new Config();
const name = config.require('namebase')
const networkStackName = config.require('networkstackname')

// Get network stack
const networkStack = new StackReference(networkStackName);
// Get the shared VPC and get the applicable outputs.
const networkVpc = networkStack.getOutput('vpc') as Output<Vpc>;
const vpcId = networkVpc.id // use the id to essentiall find the VPC below
const subnets = networkVpc.publicSubnetIds  // use the public subnets passed back from network stack

// Since the VPC already exists, awsx.ec2.Vpc returns a handle to the existing VPC that can then be used in subsequent
// awsx.X.X invokes.
const vpc = new awsx.ec2.Vpc(`${name}-vpc`, {
  vpcId: vpcId 
});

export const loadBalancer = new LoadBalancer(`${name}-lb`, {
  vpc, // this is an awsx.ec2.Vpc type from the "rehydration" of the vpc  above
  subnets // this is essentially an array of strings for each subnet ID from the network stack
  });


