import sys
import json
import pulumi
from pulumi import automation as auto
import pulumi_pulumiservice as pulumicloud
from argsparser import create_parser

# An inline automation API program that configures Deployment settings for a given stack.
# It is a pretty dumb program with most of the intelligence being set up in the config by the main automation api code.
def pulumi_program():
    # Gather up the settings for the deployment configuration
    config = pulumi.Config()

    # Use the Pulumi Cloud SDK to configure deployments for a given stack
    deployment = pulumicloud.DeploymentSettings(f"{org}-{project}-{stack}", pulumicloud.DeploymentSettingsArgs(
        organization=config.require("organization"),
        project=config.require("project"),
        stack=config.require("stack"),
        github=pulumicloud.DeploymentSettingsGithubArgs(
            deploy_commits=True,
            preview_pull_requests=True,
            pull_request_template=False,
            repository=config.require("repository"),
            paths=[config.require("filter_path")],
        ),
        source_context=pulumicloud.DeploymentSettingsSourceContextArgs(
            git=pulumicloud.DeploymentSettingsGitSourceArgs(
                branch=config.require("branch"),
                repo_dir=config.require("repo_dir"),
            )
        ),
        operation_context=pulumicloud.DeploymentSettingsOperationContextArgs(
            environment_variables=[{"GITHUB_TOKEN": config.require_secret("github_token")}],
            oidc=pulumicloud.OperationContextOIDCArgs(
                aws=pulumicloud.AWSOIDCConfigurationArgs(
                    role_arn=config.require("oidc_role_arn"),
                    session_name="pulumi-cloud"
                )
            ),
            options=pulumicloud.OperationContextOptionsArgs(
                skip_install_dependencies=True
            ),
            pre_run_commands=["git config --global url.https://${GITHUB_TOKEN}@github.com/.insteadOf https://github.com/"]
        )
    ))

    # Export the website URL
    pulumi.export("Deployment_ID", deployment.id)

# Get the command line arguments
parser = create_parser()
args = parser.parse_args()
org = args.org
tenant = args.tenant
destroy = args.destroy
aws_oidc_arn = args.awsoidc
github_token =  args.github_token

# Get/set the tenant's project and stack information for which deployments should be set up.
tenant_project_folder: str
tenant_project_name:str 
tenant_stack:str
tenant_branch_base = "refs/head"
tenant_branch = f"{tenant_branch_base}/main"
if args.account:
    tenant_project_folder = "account"
    tenant_project_name = f"{tenant}-account"
    tenant_stack = "account"
elif args.github:
   tenant_project_folder = "github"
   tenant_project_name = f"{tenant}-github"
   tenant_stack = "github"
elif args.route53:
   tenant_project_folder = "route53-record"
   tenant_project_name = f"{tenant}-route53" # NEED TO CONFIRM THIS NAMING
   tenant_stack = "records"
elif args.core:
   tenant_project_folder = "core-platform"
   tenant_project_name = f"{tenant}-core"
   tenant_stack = args.stack
   if tenant_stack != "prod":
        tenant_branch = f"{tenant_branch_base}/{tenant_stack}"
elif args.edge:
   tenant_project = "edge-platform"
   tenant_project_name = f"{tenant}-edge"
   tenant_stack = args.stack
   if tenant_stack != "prod":
        tenant_branch = f"{tenant_branch_base}/{tenant_stack}"
else:
   print("Must specify at least one project (e.g. -a, -g, -r, -c, -e).\nRun with --help for more information.")
   sys.exit(255)

# Deployment config related settings
github_repo = "modusintegration/vnext-tenants"
repo_dir = f"tenants/{tenant}/{tenant_project_folder}"
filter_path = f"**/{repo_dir}/**"

# project/stack information for the stack that is being run here to create the deployment configuration for the tenant's stack.
# kinda meta
project_name = "deployment_configuration"
stack_name = auto.fully_qualified_stack_name(org, tenant_project_name, tenant)

# create or select a stack matching the specified name and project.
# this will set up a workspace with everything necessary to run our inline program (pulumi_program)
stack = auto.create_or_select_stack(stack_name=stack_name,
                                    project_name=project_name,
                                    program=pulumi_program)

print("successfully initialized stack")

# for inline programs, we must manage plugins ourselves
print("installing plugins...")
stack.workspace.install_plugin("pulumi-pulumiservice", "v0.11.0")
print("plugins installed")

# set stack configuration specifying the AWS region to deploy
print("setting up config")
stack.set_config("organization", auto.ConfigValue(value=org))
stack.set_config("project", auto.ConfigValue(value=tenant_project))
stack.set_config("stack", auto.ConfigValue(value=tenant_stack))
stack.set_config("repository", auto.ConfigValue(value=github_repo))
stack.set_config("filter_path", auto.ConfigValue(value=filter_path))
stack.set_config("branch", auto.ConfigValue(value=tenant_branch))
stack.set_config("repo_dir", auto.ConfigValue(value=repo_dir))
stack.set_config("github_token", auto.ConfigValue(value=auto.Secret(github_token)))
stack.set_config("oidc_role_arn", auto.ConfigValue(value=aws_oidc_arn))
print("config set")

print("refreshing stack...")
stack.refresh(on_output=print)
print("refresh complete")

if destroy:
    print("destroying stack...")
    stack.destroy(on_output=print)
    print("stack destroy complete")
    sys.exit()

print("updating stack...")
up_res = stack.up(on_output=print)
print(f"update summary: \n{json.dumps(up_res.summary.resource_changes, indent=4)}")
