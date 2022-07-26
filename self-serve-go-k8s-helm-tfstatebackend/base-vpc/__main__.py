"""A Python Pulumi program"""

import pulumi
from pulumi_pulumiservice import StackTag, StackTagArgs
import pulumi_terraform as terraform


# Add a stack tag on the stack in the Pulumi Service.
config = pulumi.Config()
org_name = config.require("orgName")
app_name = config.require("appName")
stackTag = StackTag("stackTag", StackTagArgs(
  name = "Application",
  value= app_name,
  organization=org_name,
  project=pulumi.get_project(),
  stack=pulumi.get_stack()
))

config = pulumi.Config()
tf_state_bucket = config.require("tf_state_bucket")
tf_state_file = config.require("tf_state_file_key")

base_infra_state = terraform.state.RemoteStateReference("base_infra", 
  backend_type = "s3",
  args = terraform.state.S3BackendArgs(
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
