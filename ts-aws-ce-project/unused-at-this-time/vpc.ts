import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws"
import * as awsx from "@pulumi/awsx"

interface StandardVpcArgs {
  vpcCidr?: pulumi.Input<string>;
  provider?: pulumi.ProviderResource;
  tags?: aws.Tags;
};

export class StandardVpc extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnetIds: pulumi.Output<string>[]
  public readonly privateSubnetIds: pulumi.Output<string>[]

  constructor(name: string, args: StandardVpcArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:x:StandardVpc", name, args, opts);
    
    const cidrBlocks = getCidrBlocks(args.vpcCidr)
    const tags = args.tags || {}

    let provider = args.provider
    if (!provider) {
       provider = this.getProvider("::aws")
    }

    this.vpc = new aws.ec2.Vpc(`${name}-vpc`, {
      cidrBlock: cidrBlock,
      enableDnsHostnames: true,
      tags: { ...args.tags },
    }, { parent: this, provider: provider })

    const igw = new aws.ec2.InternetGateway(`${name}-igw`, {
      vpcId: this.vpc.id,
      tags: { ...args.tags },
    }, { parent: this.vpc, provider: provider })

    const rt = new aws.ec2.RouteTable(`${name}-pub-rt`, {
      vpcId: this.vpc.id,
      tags: { ...args.tags },
    }, { parent: this.vpc, provider: provider });
    const pubroute = new aws.ec2.Route(`${name}-public-route`, {
      routeTableId: rt.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    }, { parent: rt, provider: provider });

    const azNames = pulumi.output(getAvailabilityZoneNames())
    this.subnets = azNames.then(azNames => {
    const snetIds = []
    for (let i = 0; i < azNames.length; i++) {
      const azName = azNames[i]
      let subnet = new aws.ec2.Subnet(`${name}-subnet-${azName}`, {
        cidrBlock: cidrBlock,
        vpcId: this.vpc.id,
        availabilityZone: `${azName}`,
        tags: { ...args.tags },
      }, { parent: this.vpc })
      snetIds[i] = subnet.id
    }
    return snetIds
  })
  }
}

async function getAvailabilityZoneNames() {
  const azs = await aws.getAvailabilityZones({
    state: "available",
  })
  const azNames = []
  for (let i = 0; i < azs.zoneIds.length; i++) {
    azNames.push(azs.names[i])
  }
  return azNames
}

function getCidrBlocks(vpcCidr?: pulumi.Input<string>) {
  const vpcBlock = vpcCidr || "10.0.0.0/16"
  const publicSubnet


  return {
    vpcCidr: vpcBlock
  }
}