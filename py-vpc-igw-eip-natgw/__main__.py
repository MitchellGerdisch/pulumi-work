"""An AWS Python Pulumi program"""

import pulumi
import pulumi_aws as aws

nameBase="mitch-"

vpc = aws.ec2.Vpc(
    resource_name=nameBase+"vpc",
    cidr_block="10.0.0.0/16")

igw = aws.ec2.InternetGateway("gw",
    vpc_id=vpc.id
)

subnet = aws.ec2.Subnet(
    resource_name=nameBase+"subnet",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    tags={
        "Name": nameBase+"subnet",
    })

eip = aws.ec2.Eip(
  resource_name=nameBase+"eip",
  vpc=True)

pulumi.export('eip.id', eip.id)

ngw = aws.ec2.NatGateway(
    resource_name=nameBase+"gw",
    allocation_id=eip.id,
    subnet_id=subnet.id
)