import pulumi
import pulumi_aws as aws

# Get user-provided config as well as the VPC and subnet IDs and security group from the Terraform state file.
from config import base_vpc_id, public_subnet_ids, http_ssh_security_group_id, base_name, instance_type, num_instances

# Create some instances in the TF-managed VPC.
# Look up the latest Amazon Linux 2 AMI to use for each instance.
ami = aws.ec2.get_ami(filters=[aws.ec2.GetAmiFilterArgs(
        name="name",
        # This image family supports AWS console connect.
        values=["al2023-ami-2023.*-kernel-6.1-x86_64"]
    )],
    owners=["amazon"],
    most_recent=True).id

# User data to start a HTTP server in each EC2 instance
user_data = """#!/bin/bash
echo "Hello World,  from Pulumi!" > index.html
sudo yum install -y python
nohup sudo python -m http.server 80 &
"""

# Loop and create instance(s) across the subnets created by the network component.
for i in range(num_instances):
    # Unique name for each instance.
    server_name = f"{base_name}-{i}"

    # Use modulo math to distribute the instances across the subnets.
    # So identify which subnet to use based on the index.
    def get_subnet_id(subnets, i):
        return subnets[i % len(subnets)]

    subnet_id = pulumi.Output.all(public_subnet_ids, i).apply(lambda args: get_subnet_id(args[0], args[1]))  

    # Create the instance
    server = aws.ec2.Instance(server_name,
        instance_type=instance_type,
        subnet_id=subnet_id,
        vpc_security_group_ids=[http_ssh_security_group_id],
        user_data=user_data,
        ami=ami,
        tags={
            "Name": server_name,
        }, 
        opts=pulumi.ResourceOptions(replace_on_changes=["user_data"]))

    # Export the instance's publicly accessible IP address and hostname.
    pulumi.export(f"{server_name} ip", server.public_ip)
    pulumi.export(f"{server_name} hostname", server.public_dns)
    pulumi.export(f"{server_name} subnet", server.subnet_id)
    pulumi.export(f"{server_name} url", pulumi.Output.concat("http://",server.public_dns))


# Export the values from the TF state to make it easier for other stacks to reference if needed.
pulumi.export("base_vpc_id", base_vpc_id)
pulumi.export("public_subnet_ids", public_subnet_ids)
