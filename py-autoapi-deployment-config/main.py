import sys
import json
from pulumi import automation as auto
from argsparser import create_parser
from stack_management import stack_management
from stacks_base_properties import github_repo, vnext_stacks

# Get the command line arguments
parser = create_parser()
args = parser.parse_args()
org = args.org
tenant = args.tenant
destroy = args.destroy
aws_oidc_arn = args.awsoidc
github_token =  args.github_token

# # Get/set the tenant's project and stack information for which deployments should be set up.
# tenant_project_folder: str
# tenant_project_name:str 
# tenant_stack:str
# tenant_branch_base = "refs/head"
# tenant_branch = f"{tenant_branch_base}/main"
# if args.account:
#     tenant_project_folder = "account"
#     tenant_project_name = f"{tenant}-account"
#     tenant_stack = "account"
# elif args.github:
#    tenant_project_folder = "github"
#    tenant_project_name = f"{tenant}-github"
#    tenant_stack = "github"
# elif args.route53:
#    tenant_project_folder = "route53-record"
#    tenant_project_name = f"{tenant}-route53" # NEED TO CONFIRM THIS NAMING
#    tenant_stack = "records"
# elif args.core:
#    tenant_project_folder = "core-platform"
#    tenant_project_name = f"{tenant}-core"
#    tenant_stack = args.stack
#    if tenant_stack != "prod":
#         tenant_branch = f"{tenant_branch_base}/{tenant_stack}"
# elif args.edge:
#    tenant_project_folder = "edge-platform"
#    tenant_project_name = f"{tenant}-edge"
#    tenant_stack = args.stack
#    if tenant_stack != "prod":
#         tenant_branch = f"{tenant_branch_base}/{tenant_stack}"
# else:
#    print("Must specify at least one project (e.g. -a, -g, -r, -c, -e).\nRun with --help for more information.")
#    sys.exit(255)

### repo_dir = f"tenants/{tenant}/{tenant_project_folder}"
# repo_dir = "simple-stack"
# filter_path = f"**/{repo_dir}/**"

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

# Test the stacks to see which exist and thus can have Pulumi Cloud settings configured for them
existing_stacks = []
for project_info in vnext_stacks:
    tenant_project_name = f'{tenant}-{project_info["project_basename"]}'
    tenant_stack_name = auto.fully_qualified_stack_name(org, tenant_project_name, project_info["stack_name"])
    try:
        test_stack=auto.select_stack(stack_name=tenant_stack_name, project_name=tenant_project_name, work_dir=".")
        existing_stacks.append(project_info)
    except:
        print(f"Skipping stack (not found): {tenant_stack_name}")



# set stack configuration to be consumed by the inline program.
print("setting up config")
this_stack.set_config("organization", auto.ConfigValue(value=org))
this_stack.set_config("tenant", auto.ConfigValue(value=tenant))
this_stack.set_config("repository", auto.ConfigValue(value=github_repo))
this_stack.set_config("github_token", auto.ConfigValue(value=auto.Secret(github_token)))
this_stack.set_config("aws_oidc_role_arn", auto.ConfigValue(value=aws_oidc_arn))

# The existing_stacks information is just pushed out to a file as json instead of trying to create stack config for it.
with open("existing_stacks.json", "w") as outfile:
    json.dump(existing_stacks, outfile)

print("config set")

print("refreshing stack...")
this_stack.refresh(on_output=print)
print("refresh complete")

if destroy:
    print("destroying stack...")
    this_stack.destroy(on_output=print)
    print("stack destroy complete")
    sys.exit()

print("updating stack...")
up_res = this_stack.up(on_output=print)
print(f"update summary: \n{json.dumps(up_res.summary.resource_changes, indent=4)}")
