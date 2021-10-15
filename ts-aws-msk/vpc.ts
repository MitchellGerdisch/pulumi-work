import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws"



interface StandardVpcArgs {
  vpcCidr: pulumi.Input<string>;
  subnetCidrBlocks: pulumi.Input<string>[];
  region: pulumi.Input<string>;
  tags?: aws.Tags;
};

export class StandardVpc extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly subnets: pulumi.Output<string>[];
  public readonly sgs: pulumi.Output<string>[];

  constructor(name: string, args: StandardVpcArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:x:StandardVpc", name, args, opts);

    this.vpc = new aws.ec2.Vpc(`${name}-vpc`, {
      cidrBlock: args.vpcCidr,
      enableDnsHostnames: true,
      tags: { ...args.tags },
    }, { parent: this })

    const igw = new aws.ec2.InternetGateway(`${name}-igw`, {
      vpcId: this.vpc.id,
      tags: { ...args.tags },
    }, { parent: this.vpc })

    const rt = new aws.ec2.RouteTable(`${name}-pub-rt`, {
      vpcId: this.vpc.id,
      tags: { ...args.tags },
    }, { parent: this.vpc });
    const pubroute = new aws.ec2.Route(`${name}-public-route`, {
      routeTableId: rt.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    }, { parent: rt });

    const az1_subnet = new aws.ec2.Subnet(`${name}-az1snet`, {
      cidrBlock: args.subnetCidrBlocks[0],
      vpcId: this.vpc.id,
      availabilityZone: `${args.region}a`,
      tags: { ...args.tags },
    }, { parent: this.vpc })
    const az2_subnet = new aws.ec2.Subnet(`${name}-az2snet`, {
      cidrBlock: args.subnetCidrBlocks[1],
      vpcId: this.vpc.id,
      availabilityZone: `${args.region}b`,
      tags: { ...args.tags },
    }, { parent: this.vpc })
    this.subnets = [az1_subnet.id, az2_subnet.id ]

    const sg = new aws.ec2.SecurityGroup(`${name}-sg`, {
      vpcId: this.vpc.id,
      tags: { ...args.tags },
    }, { parent: this.vpc })
    const sgSshRule = new aws.ec2.SecurityGroupRule(`${name}-ssh`, {
      fromPort: 22,
      protocol: "tcp",
      securityGroupId: sg.id,
      toPort: 22,
      type: "ingress",
      cidrBlocks: ["0.0.0.0/0"],
    }, { parent: sg})
    this.sgs = [sg.id]
  }
}