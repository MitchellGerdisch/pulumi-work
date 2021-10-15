from pulumi import ComponentResource, ResourceOptions
from pulumi_aws import ec2, get_availability_zones

# VPC
class VpcArgs:

    def __init__(self,
                 cidr_block='10.100.0.0/16',
                 instance_tenancy='default',
                 enable_dns_hostnames=True,
                 enable_dns_support=True,
                 ):
        self.cidr_block = cidr_block
        self.instance_tenancy = instance_tenancy
        self.enable_dns_hostnames = enable_dns_hostnames
        self.enable_dns_support = enable_dns_support


class Vpc(ComponentResource):

    def __init__(self,
                 name: str,
                 args: VpcArgs,
                 opts: ResourceOptions = None):

        super().__init__('custom:resource:VPC', name, {}, opts)

        vpc_name = name+'-vpc'
        self.vpc = ec2.Vpc(vpc_name,
            cidr_block=args.cidr_block,
            instance_tenancy=args.instance_tenancy,
            enable_dns_hostnames=args.enable_dns_hostnames,
            enable_dns_support=args.enable_dns_support,
            tags={
                'Name': vpc_name
            },
            opts=ResourceOptions(parent=self)
            )

        igw_name = name+'-igw'
        self.igw = ec2.InternetGateway(igw_name,
            vpc_id=self.vpc.id,
            tags={
                'Name': igw_name
            },
            opts=ResourceOptions(parent=self)
            )

        rt_name = name+'-rt'
        self.route_table = ec2.RouteTable(rt_name,
            vpc_id=self.vpc.id,
            routes=[ec2.RouteTableRouteArgs(
                cidr_block='0.0.0.0/0',
                gateway_id=self.igw.id,
            )],
            tags={
                'Name': rt_name
            },
            opts=ResourceOptions(parent=self)
            )

        # Subnets - public and private in each AZ
        all_zones = get_availability_zones()
        zone_names = all_zones.names
        self.public_subnet_ids = []
        self.private_subnet_ids = []
        public_subnet_name_base = f'{name}-pub-subnet'
        private_subnet_name_base = f'{name}-priv-subnet'
        for zone in zone_names:
            public_subnet = ec2.Subnet(f'{public_subnet_name_base}-{zone}',
                assign_ipv6_address_on_creation=False,
                vpc_id=self.vpc.id,
                map_public_ip_on_launch=True,
                cidr_block=f'10.100.{len(self.public_subnet_ids)}.0/24',
                availability_zone=zone,
                tags={
                    'Name': f'{public_subnet_name_base}-{zone}',
                },
                opts=ResourceOptions(parent=self)
            )
            ec2.RouteTableAssociation(
                f'vpc-route-table-assoc-{zone}',
                route_table_id=self.route_table.id,
                subnet_id=public_subnet.id,
                opts=ResourceOptions(parent=self)
            )
            self.public_subnet_ids.append(public_subnet.id)

            private_subnet = ec2.Subnet(f'{private_subnet_name_base}-{zone}',
                assign_ipv6_address_on_creation=False,
                vpc_id=self.vpc.id,
                map_public_ip_on_launch=False,
                cidr_block=f'10.100.10{len(self.private_subnet_ids)}.0/24',
                availability_zone=zone,
                tags={
                    'Name': f'{private_subnet_name_base}-{zone}',
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnet_ids.append(private_subnet.id)

        # Security Groups
        pub_sg_name = f'{name}-pub-sg'
        self.pub_security_group = ec2.SecurityGroup(pub_sg_name,
            vpc_id=self.vpc.id,
            description='Allow all HTTP(s) traffic.',
            tags={
                'Name': pub_sg_name
            },
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    cidr_blocks=[
                        '0.0.0.0/0'],
                    from_port=443,
                    to_port=443,
                    protocol='tcp',
                    description='Allow https.'
                ),
                ec2.SecurityGroupIngressArgs(
                    cidr_blocks=[
                        '0.0.0.0/0'],
                    from_port=80,
                    to_port=80,
                    protocol='tcp',
                    description='Allow http access'
                ),
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=[
                        '0.0.0.0/0'],
                )],
            opts=ResourceOptions(
                parent=self)
            )

        self.register_outputs({})