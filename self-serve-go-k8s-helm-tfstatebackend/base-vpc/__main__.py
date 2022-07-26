"""A Python Pulumi program"""

import pulumi
import pulumi_terraform as terraform
from pulumi_terraform.state.remote_state_reference import BackendArgs, S3BackendArgs

config = pulumi.Config()
tf_state_bucket = config.require("tf_state_bucket")
tf_state_file = config.require("tf_state_file_key")

base_infra_state = terraform.state.RemoteStateReference("base_infra", 
  backend_type = "s3",
  args = S3BackendArgs(
    bucket=tf_state_bucket,
    key=tf_state_file,
    region="us-east-2"
  )
)

# Read the VPC and subnet IDs into variables:
base_vpc_id = base_infra_state.get_output("vpc_id")
public_subnet_ids = base_infra_state.get_output("public_subnet_ids")

# Export the values from this stack to be consumed by other stacks
pulumi.export("base_vpc_id", base_vpc_id)
pulumi.export("public_subnet_ids", public_subnet_ids)
pulumi.export("num_subnets", 2)
