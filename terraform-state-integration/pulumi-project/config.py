import pulumi
import pulumi_terraform as terraform

stack_name = pulumi.get_stack()

config = pulumi.Config()

# Get the Terraform state backend information.
tf_state_bucket = config.require("tf_state_bucket")
# The accompanying Terraform code sets up the backend state file name as "tf-state". 
# If you change that, then use `pulumi config set tf_state_file_name <new_state_file_name>` to set the new state file name.
tf_state_file_name = config.get("tf_state_file_name") or "tf-state"

# Create a reference to the Terraform state file from the base_infra stack.
base_infra_state = terraform.state.RemoteStateReference("base_infra", 
  backend_type = "s3",
  args = terraform.state.S3BackendArgs(
    bucket=tf_state_bucket,
    key=tf_state_file_name,
    region="us-east-2"
  )
)

# Read the VPC and subnet IDs into variables from the terraform base_infra state.:
base_vpc_id = base_infra_state.get_output("vpc_id")
public_subnet_ids = base_infra_state.get_output("public_subnet_ids")
http_ssh_security_group_id = base_infra_state.get_output("security_group_id")

# Get config related to the instances
num_instances = config.get_int("num_instances") or 1
instance_type = config.get("instanceType") or "t3.micro"

# Get an optional base name to use for naming conventions.
base_name = config.get("base_name") or "webserver"
