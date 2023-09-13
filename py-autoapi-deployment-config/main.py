import os
import sys
import json
from pulumi import automation as auto
from argsparser import create_parser
from stack_management import stack_management
from stacks_base_properties import stack_properties

# Get the command line arguments
parser = create_parser()
args = parser.parse_args()
org = args.org
tenant = args.tenant
destroy = args.destroy
aws_oidc_arn = args.awsoidc
github_repo = args.github_repo
github_token =  args.github_token
debug = args.debug

# project/stack information for the stack that is being run here to create the deployment configuration for the tenant's stack.
# kinda meta
this_project_name = "stack_management"
this_stack_name = auto.fully_qualified_stack_name(org, this_project_name, tenant)

# create or select a stack matching the specified name and project.
# this will set up a workspace with everything necessary to run our inline program (pulumi_program)
this_stack = auto.create_or_select_stack(stack_name=this_stack_name,
                                    project_name=this_project_name,
                                    program=stack_management)

print("successfully initialized stack")

# for inline programs, we must manage plugins ourselves
print("installing plugins...")
this_stack.workspace.install_plugin("pulumiservice", "v0.11.0")
print("plugins installed")

# If this is a stack destroy, then just destroy and get out.
if destroy:
    print("destroying stack...")
    this_stack.destroy(on_output=print)
    print("stack destroy complete")
    sys.exit()

# Test the stacks to see which exist and thus can have Pulumi Cloud settings configured for them
existing_stacks_file = "existing_stacks.json"
existing_stacks = []
for stack_info in stack_properties:
    tenant_project_name = f'{tenant}-{stack_info["project_basename"]}'
    tenant_stack_name = auto.fully_qualified_stack_name(org, tenant_project_name, stack_info["stack_name"])
    try:
        test_stack=auto.select_stack(stack_name=tenant_stack_name, project_name=tenant_project_name, work_dir=".")
        existing_stacks.append(stack_info)
    except:
        print(f"Skipping stack (not found): {tenant_stack_name}")

# set stack configuration to be consumed by the inline program.
print("setting up config")
this_stack.set_config("organization", auto.ConfigValue(value=org))
this_stack.set_config("tenant", auto.ConfigValue(value=tenant))
this_stack.set_config("repository", auto.ConfigValue(value=github_repo))
this_stack.set_config("github_token", auto.ConfigValue(value=auto.Secret(github_token)))
this_stack.set_config("aws_oidc_role_arn", auto.ConfigValue(value=aws_oidc_arn))
this_stack.set_config("existing_stacks_file", auto.ConfigValue(value=existing_stacks_file))

# The existing_stacks information is just pushed out to a file as json instead of trying to create stack config for it.
# Unless the debug argument is set, the file will be deleted after the code has run (see below).
with open(existing_stacks_file, "w") as outfile:
    json.dump(existing_stacks, outfile)

print("config set")

print("refreshing stack...")
this_stack.refresh(on_output=print)
print("refresh complete")

print("updating stack...")
up_res = this_stack.up(on_output=print)
print(f"update summary: \n{json.dumps(up_res.summary.resource_changes, indent=4)}")

# Remove the existing stacks file since we are done with it.
if not debug:
    os.remove(existing_stacks_file)
else:
    print(f"**DEBUG** Not deleting file: {existing_stacks_file}")
