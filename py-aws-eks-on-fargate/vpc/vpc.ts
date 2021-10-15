import {Output, ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi';
import * as awsx from '@pulumi/awsx';

// no args in this basic use-case
interface Args {
}

export default class Vpc extends ComponentResource {
  id: Output<string>;
  publicSubnetIds: Promise<Output<string>[]>;
  privateSubnetIds: Promise<Output<string>[]>;

  constructor(
    componentName: string,
    args: Args,
    options?: ComponentResourceOptions
  ) {
    super('Vpc', componentName, args, options);

    // build VPC with mostly defaults 
    const vpc = new awsx.ec2.Vpc(
      `${componentName}-vpc`,
      {
        numberOfAvailabilityZones: 2,
        subnets: [
          { type: 'public', cidrMask: 20, tags: { "kubernetes.io/role/elb":"1" }},
          { type: 'private', cidrMask: 20, tags: { "kubernetes.io/role/internal-elb":"1" }},
        ],
        tags: { "Name": `${componentName}-vpc`},
      },
      {
        parent: this,
      }
    );

    this.id = vpc.id;
    this.publicSubnetIds = vpc.publicSubnetIds;
    this.privateSubnetIds = vpc.privateSubnetIds;
  }
}
