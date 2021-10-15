import * as aws from "@pulumi/aws";
import { Input } from "@pulumi/pulumi";
import * as pulumi from "@pulumi/pulumi";

/**
 * Landing Zone
 */
interface LandingZoneArgs {
    cidrBlock: Input<string>;
    publicSubnetCidrBlocks?: Input<string>[];
    privateSubnetCidrBlocks?: Input<string>[];
    tags?: aws.Tags;
    monthlyBudget?: Input<string>;
};

export class LandingZone extends pulumi.ComponentResource {
    public readonly vpc: aws.ec2.Vpc;
    public readonly publicSubnets: aws.ec2.Subnet[];
    public readonly privateSubnets: aws.ec2.Subnet[];

    constructor(name: string, args: LandingZoneArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:x:LandingZone", name, args, opts);

        const accountId = aws.getCallerIdentity();

        /**
         * Budget
         */
        const budget = new aws.budgets.Budget(name, {
            accountId: accountId.then(it => it.accountId),
            budgetType: "COST",
            limitAmount: args.monthlyBudget || "500.0",
            limitUnit: "USD",
            timePeriodStart: "2010-01-01_00:00",
            timeUnit: "MONTHLY",
        }, { parent: this });

        /**
         * VPC
         */
        const azs = aws.getAvailabilityZones({ state: "available" });

        this.vpc = new aws.ec2.Vpc(name, {
            cidrBlock: args.cidrBlock,
            enableDnsHostnames: true,
            tags: { ...args.tags },
        }, { parent: this });

        // Create an Internet Gateway for our public subnet to connect to the Internet.
        const internetGateway = new aws.ec2.InternetGateway(`${name}-public`, {
            vpcId: this.vpc.id,
            tags: { ...args.tags },
        }, { parent: this.vpc });

        // Creat a Route Table for public subnets to use the Internet Gateway for 0.0.0.0/0 traffic.
        const publicSubnetRouteTable = new aws.ec2.RouteTable(`${name}-public`, {
            vpcId: this.vpc.id,
            tags: { ...args.tags },
        }, { parent: this.vpc });
        const publicSubnetRoute = new aws.ec2.Route(`${name}-public`, {
            routeTableId: publicSubnetRouteTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            gatewayId: internetGateway.id,
        }, { parent: publicSubnetRouteTable });

        this.publicSubnets = [];
        this.privateSubnets = [];

        for (let i = 0; i < (args.publicSubnetCidrBlocks?.length ?? 0); i++) {
            const az = azs.then(it => it.zoneIds[i]);

            /**
             * Public Subnets
             */
            const publicSubnet = new aws.ec2.Subnet(`${name}-public-${i}`, {
                vpcId: this.vpc.id,
                availabilityZoneId: az,
                cidrBlock: args.publicSubnetCidrBlocks![i],
                mapPublicIpOnLaunch: true,
                tags: { ...args.tags },
            }, {
                parent: this.vpc,
                deleteBeforeReplace: true,
            });
            this.publicSubnets.push(publicSubnet);

            const publicSubnetRouteTableAssociation = new aws.ec2.RouteTableAssociation(`${name}-public-${i}`, {
                subnetId: publicSubnet.id,
                routeTableId: publicSubnetRouteTable.id,
            }, { parent: publicSubnet });

            /**
             * Private Subnets
             */
            if (args.privateSubnetCidrBlocks) {
                const natEip = new aws.ec2.Eip(`${name}-public-${i}`, {
                    vpc: true,
                    tags: { ...args.tags },
                }, {
                    dependsOn: internetGateway,
                    parent: this,
                });
                const natGateway = new aws.ec2.NatGateway(`${name}-public-${i}`, {
                    subnetId: publicSubnet.id,
                    allocationId: natEip.id,
                    tags: { ...args.tags },
                }, { parent: publicSubnet });

                const privateSubnet = new aws.ec2.Subnet(`${name}-private-${i}`, {
                    vpcId: this.vpc.id,
                    availabilityZoneId: az,
                    cidrBlock: args.privateSubnetCidrBlocks[i],
                    mapPublicIpOnLaunch: false,
                    tags: { ...args.tags },
                }, {
                    parent: this.vpc,
                    deleteBeforeReplace: true,
                });
                this.privateSubnets.push(privateSubnet);

                const privateSubnetRouteTable = new aws.ec2.RouteTable(`${name}-private-${i}`, {
                    vpcId: this.vpc.id,
                    tags: { ...args.tags },
                }, { parent: this.vpc });
                const privateSubnetRoute = new aws.ec2.Route(`${name}-private-${i}`, {
                    routeTableId: privateSubnetRouteTable.id,
                    destinationCidrBlock: "0.0.0.0/0",
                    natGatewayId: natGateway.id,
                }, { parent: privateSubnetRouteTable });
                const privateSubnetRouteTableAssociation = new aws.ec2.RouteTableAssociation(`${name}-private-${i}`, {
                    subnetId: privateSubnet.id,
                    routeTableId: privateSubnetRouteTable.id,
                }, { parent: privateSubnet });
            }
        }

        this.registerOutputs()
    }

}

/**
 * Web Environment
 */
export interface WebEnvironmentArgs {
    imageId: Input<string>;
    instanceCount: Input<number>;
    baseTags: aws.Tags;
    vpcId: Input<string>;
    subnetIds: Input<string>[];
}

export class WebEnvironment extends pulumi.ComponentResource {
    public readonly instances: aws.ec2.Instance[];
    public readonly securityGroup: aws.ec2.SecurityGroup;

    constructor(name: string, args: WebEnvironmentArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:x:WebEnvironment", name, {}, opts);

        this.instances = [];

        // create a security group
        const webSg = new aws.ec2.SecurityGroup(`${name}-sg`, {
            vpcId: args.vpcId,
            ingress: [
                { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["10.0.0.0/16"] },
            ],
            tags: { ...args.baseTags, },
        }, { parent: this });

        // create instances
        const instanceCount = args.instanceCount;
        for (let i = 0; i < instanceCount; i++) {
            const webServer = new aws.ec2.Instance(`${name}-server-${i}`, {
                instanceType: aws.ec2.InstanceTypes.T3_Medium,
                associatePublicIpAddress: true,
                ami: args.imageId,
                subnetId: args.subnetIds[0], // TODO: spread across the zones
                vpcSecurityGroupIds: [webSg.id],
                tags: { ...args.baseTags, },
            }, { parent: this });
            this.instances.push(webServer);
        }

        this.registerOutputs({});
    }
}
