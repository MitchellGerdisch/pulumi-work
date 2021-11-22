# Copyright 2021, Pulumi Corporation.  All rights reserved.
# Demonstrates:
# - Tagging in AWS native: This requires an array of {key:KEYNAME, value:VALUE} objects.
#   This is different than AWS classic which just took a {key:value, key2:value} object.
# - Demonstrates how to do a tagging transformation ala https://www.pulumi.com/blog/automatically-enforcing-aws-resource-tagging-policies/
#   But the tag-array model requires tweaking things a little.

import pulumi
import pulumi_aws_native 
from autotag import register_auto_tags

register_auto_tags(
    [
        {"key":'hamster', "value":'sniffles'},
        {"key":'dog', "value":'bijou'},
    ]
)

vpc_name = "aws-native-vpc"
vpc = pulumi_aws_native.ec2.VPC(vpc_name,
    cidr_block="10.200.1.0/24",
    tags=[
        {"key":"Name", "value":vpc_name},
    ]
)

pulumi.export("vpc_id", vpc.id)
