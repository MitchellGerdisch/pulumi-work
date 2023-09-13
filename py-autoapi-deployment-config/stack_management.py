import pulumi
import pulumi_pulumiservice as pulumicloud
import json

# An inline automation API program that configures the following resources in Pulumi Cloud for the provided stacks:
# - Deployment settings 
# - Stack tags
def stack_management():
    # Gather up the settings for the deployment configuration
    config = pulumi.Config()
    org = config.require("organization")
    tenant = config.require("tenant")
    repository = config.require("repository")
    github_token = config.require_secret("github_token")
    aws_oidc_role_arn = config.require("aws_oidc_role_arn")
    existing_stacks_file = config.require("existing_stacks_file")

    # Load the json of existing stacks to be processed
    with open(existing_stacks_file, "r") as openfile:
        existing_stacks = json.load(openfile)

    # Loop through the stacks that were found to exist
    for stack_props in existing_stacks:
        # Set up variables for use below
        project_basename = stack_props["project_basename"]
        project_name = f"{tenant}-{project_basename}"
        stack_name = stack_props["stack_name"]
        project_folder = stack_props["project_folder"]
        repo_dir = f"tenants/{tenant}/{project_folder}"
        path_filter = f"**/{repo_dir}/**"
        deployment_name = f"{project_name}-{stack_name}"
        branch = stack_name
        if not (stack_name == "dev" or stack_name =="stg" or stack_name == "prod"):
            branch = "main"

        # Use the Pulumi Cloud SDK to configure deployments for a given stack
        deployment = pulumicloud.DeploymentSettings(deployment_name, pulumicloud.DeploymentSettingsArgs(
            organization=org,
            project=project_name,
            stack=stack_name,
            github=pulumicloud.DeploymentSettingsGithubArgs(
                deploy_commits=True,
                preview_pull_requests=True,
                pull_request_template=False,
                repository=repository,
                paths=[path_filter],
            ),
            source_context=pulumicloud.DeploymentSettingsSourceContextArgs(
                git=pulumicloud.DeploymentSettingsGitSourceArgs(
                    branch=branch,
                    repo_dir=repo_dir,
                )
            ),
            operation_context=pulumicloud.DeploymentSettingsOperationContextArgs(
                environment_variables={"GITHUB_TOKEN": github_token},
                oidc=pulumicloud.OperationContextOIDCArgs(
                    aws=pulumicloud.AWSOIDCConfigurationArgs(
                        role_arn=aws_oidc_role_arn,
                        session_name="pulumi-cloud"
                    )
                ),
                options=pulumicloud.OperationContextOptionsArgs(
                    skip_install_dependencies=True
                ),
                pre_run_commands=["git config --global url.https://${GITHUB_TOKEN}@github.com/.insteadOf https://github.com/"]
            )
        ))

        # Add a Pulumi Cloud stack tag to the given tenant stack so one can find all related stacks easily.
        stack_tag = pulumicloud.StackTag(deployment_name, pulumicloud.StackTagArgs(
            organization=org,
            project=project_name,
            stack=stack_name,
            name=tenant,
            value="stacks",
        ))

    # Add a stack tag to this stack which creates the deployments and other stack tags to show it is associated with the given tenant as well
    # Maybe overkill?
    this_org = pulumi.get_organization()
    this_project = pulumi.get_project()
    this_stack = pulumi.get_stack()
    stack_tag = pulumicloud.StackTag(f"{this_project}-{this_stack}", pulumicloud.StackTagArgs(
        organization=this_org,
        project=this_project,
        stack=this_stack,
        name=tenant,
        value="stacks",
    ))

  