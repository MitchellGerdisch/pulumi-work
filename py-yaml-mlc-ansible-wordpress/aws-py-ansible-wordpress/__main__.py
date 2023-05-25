import pulumi
import pulumi_aws as aws
import pulumi_command as command
import pulumi_pulumiservice as pulumi_service

# Custom Multilanguage Package
import pulumi_wpinstance as wpinstance

### GET CONFIG VALUES FOR STACK ###
config = pulumi.Config()
# A path to the EC2 keypair's public key:
public_key_path = config.require("publicKeyPath")
# A path to the EC2 keypair's private key:
private_key_path = config.require("privateKeyPath")
# The WordPress database size:
db_instance_size = config.get("dbInstanceSize") or "db.t3.small"
# The WordPress database name:
db_name = config.get("dbName") or "wordpressdb"
# The WordPress database user's name:
db_username = config.get("dbUsername") or "admin"
# The WordPress database user's password:
db_password = config.require_secret("dbPassword")
# The WordPress EC2 instance's size:
ec2_instance_size = config.get("ec2InstanceSize") or "t3.small"
# Route53 zone name given
zone_name = config.get("zoneName")

# Dynamically fetch AZs so we can spread across them.
availability_zones = aws.get_availability_zones()

# Read in the public key for easy use below.
public_key = open(public_key_path).read()
# Read in the private key for easy use below (and to ensure it's marked a secret!)
private_key = pulumi.Output.secret(open(private_key_path).read())

### SET UP VPC ###
# Set up a Virtual Private Cloud to deploy our EC2 instance and RDS datbase into.
prod_vpc = aws.ec2.Vpc("prod-vpc",
    cidr_block="10.192.0.0/16",
    enable_dns_support=True, # gives you an internal domain name
    enable_dns_hostnames=True, # gives yoiu an internal host name
    enable_classiclink=False,
    instance_tenancy="default")

# Create public subnets for the EC2 instance.
prod_subnet_public1 = aws.ec2.Subnet("prod-subnet-public-1",
    vpc_id=prod_vpc.id,
    cidr_block="10.192.0.0/24",
    map_public_ip_on_launch=True,
    availability_zone=availability_zones.names[0])

# Create private subnets for RDS:
prod_subnet_private1 = aws.ec2.Subnet("prod-subnet-private-1",
    vpc_id=prod_vpc.id,
    cidr_block="10.192.20.0/24",
    map_public_ip_on_launch=False,
    availability_zone=availability_zones.names[1])
prod_subnet_private2 = aws.ec2.Subnet("prod-subnet-private-2",
    vpc_id=prod_vpc.id,
    cidr_block="10.192.21.0/24",
    map_public_ip_on_launch=False,
    availability_zone=availability_zones.names[2])

# Create a gateway for internet connectivity:
prod_igw = aws.ec2.InternetGateway("prod-igw", vpc_id=prod_vpc.id)

# Create a route table:
prod_public_rt = aws.ec2.RouteTable("prod-public-rt",
    vpc_id=prod_vpc.id,
    routes=[aws.ec2.RouteTableRouteArgs(
        # associated subnets can reach anywhere:
        cidr_block="0.0.0.0/0",
        # use this IGW to reach the internet:
        gateway_id=prod_igw.id,
    )])
prod_rta_public_subnet1 = aws.ec2.RouteTableAssociation("prod-rta-public-subnet-1",
    subnet_id=prod_subnet_public1.id,
    route_table_id=prod_public_rt.id)


### CREATE WPINSTANCE USING MLC ###
wp_instance = wpinstance.mlc.WpInstance("wp-instance", 
    instance_type = ec2_instance_size,
    public_key = public_key,
    subnet_id = prod_subnet_public1.id,
    vpc_id = prod_vpc.id
)

### SETUP RDS ###
# Security group for RDS:
rds_allow_rule = aws.ec2.SecurityGroup("rds-allow-rule",
    vpc_id=prod_vpc.id,
    ingress=[aws.ec2.SecurityGroupIngressArgs(
        description="MySQL",
        from_port=3306,
        to_port=3306,
        protocol="tcp",
        security_groups=[wp_instance.secrule_id],
    )],
    # allow all outbound traffic.
    egress=[aws.ec2.SecurityGroupEgressArgs(
        from_port=0,
        to_port=0,
        protocol="-1",
        cidr_blocks=["0.0.0.0/0"],
    )],
    tags={
        "Name": "allow ec2",
    })

# Place the RDS instance into private subnets:
rds_subnet_grp = aws.rds.SubnetGroup("rds-subnet-grp", subnet_ids=[
    prod_subnet_private1.id,
    prod_subnet_private2.id,
])

# Create the RDS instance:
wordpressdb = aws.rds.Instance("wordpressdb",
    allocated_storage=10,
    engine="mysql",
    engine_version="5.7",
    instance_class=db_instance_size,
    db_subnet_group_name=rds_subnet_grp.id,
    vpc_security_group_ids=[rds_allow_rule.id],
    db_name=db_name,
    username=db_username,
    password=db_password,
    skip_final_snapshot=True)


### RUN ANSIBLE TO CONFIGURE WP INSTANCE ###
# Render the Ansible playbook using RDS info.
render_playbook_cmd = command.local.Command("renderPlaybookCmd",
    create="cat playbook.yml | envsubst > playbook_rendered.yml",
    environment={
        "DB_RDS": wordpressdb.endpoint,
        "DB_NAME": db_name,
        "DB_USERNAME": db_username,
        "DB_PASSWORD": db_password,
    })

# Run a script to update Python on the remote machine.
update_python_cmd = command.remote.Command("updatePythonCmd",
    connection=command.remote.ConnectionArgs(
        host=wp_instance.wpinstance_ip,
        port=22,
        user="ec2-user",
        private_key=private_key,
    ),
    create="""(sudo yum update -y || true);
(sudo yum install python35 -y);
(sudo yum install amazon-linux-extras -y)
""")

# Finally, play the Ansible playbook to finish installing.
play_ansible_playbook_cmd = command.local.Command("playAnsiblePlaybookCmd",
    create=wp_instance.wpinstance_ip.apply(lambda public_ip: f"""\
ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook \
-u ec2-user \
-i '{public_ip},' \
--private-key {private_key_path} \
playbook_rendered.yml"""),
opts=pulumi.ResourceOptions(depends_on=[
        render_playbook_cmd,
        update_python_cmd,
    ]))

### ADD PULUMI STACK TAG ###
org = pulumi.get_organization()
project = pulumi.get_project()
stack = pulumi.get_stack()
stack_tag = pulumi_service.StackTag("stack-tag", #pulumi_service.StackTagArgs(
    organization=org,
    project=project,
    stack=stack,
    name="Demo",
    value="Ansible-Wordpress"
)

### CREATE DNS NAME FOR INSTANCE IF ZONE NAME GIVEN ###
wp_instance_ip = wp_instance.wpinstance_ip
# fqdn to use if no zone name given and thus no DNS entry created
fqdn = wp_instance_ip
if zone_name:
    dns_name = f"wordpress-{stack}"
    fqdn = f"{dns_name}.{zone_name}"
    zone = aws.route53.get_zone_output(name=zone_name)
    www = aws.route53.Record("www",
        zone_id=zone.zone_id,
        name=fqdn,
        type="A",
        ttl=300,
        records=[wp_instance.wpinstance_ip])
else:
    print("Run `pulumi config set zoneName ROUTE53_ZONENAME` if you want a DNS record created for the instance.")

# Export the wordpress site URL
wp_url = pulumi.Output.concat("http://", fqdn)
pulumi.export("URL", wp_url)
