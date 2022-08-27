from pulumi import automation as auto
from pulumi_orch.automate.project_utils import get_deployment_options_array, get_deployment_options, get_deployment_projects, prep_workspace, get_project_base_dir
from flask import jsonify
import sys
import json
import os

def update_stack(org: str, deployment_option: str, env: str, destroy: bool):

    print("deployment option: ", deployment_option)
    print("env: ", env)
    # Get the projects for the requested deployment_option
    projects = get_deployment_projects(deployment_option)
    if (destroy): # need to destroy the projects in reverse order
        projects = projects[::-1] 
    print("projects to process:", projects)
    stacks_results = []
    for project in projects:
        # Set project_dir for the requested project
        project_base_dir = get_project_base_dir()
        project_dir = os.path.join(os.path.dirname(__file__), project_base_dir, project) 
        print("project_dir", project_dir)

        # Set up the environment for the pulumi project/stack
        prep_workspace(project_dir, "python")

        stack_name = f"{org}/{project}/{env}"
        # Create our stack using a local program in the ../aws-py-voting-app directory
        stack = auto.create_or_select_stack(stack_name=stack_name, work_dir=project_dir)
        print("successfully initialized stack")

        print("setting up config")
        stack.set_config("azure-native:location", auto.ConfigValue(value="CentralUS"))
        stack.set_config("org", auto.ConfigValue(value=org))
        stack.set_config("base_stack_project", auto.ConfigValue(value=projects[0]))
        print("config set")

        print("refreshing stack")
        stack.refresh(on_output=print)
        print("refresh complete")

        if destroy:
            print("destroying stack...")
            stack.destroy(on_output=print)
            print("stack destroy complete")
        else:
            print("updating stack...")
            up_res = stack.up(on_output=print)
            print(f"update summary: \n{json.dumps(up_res.summary.resource_changes, indent=4)}")
            print(f"stack outputs: {up_res.outputs}")
            stack_outputs_list = []
            stack_outputs = up_res.outputs
            for key in stack_outputs:
                stack_outputs_list.append({"name":key , "value": stack_outputs[key]})
            print("stack_outputs_list", stack_outputs_list)
            stack_results = {
                "name": stack_name,
                "outputs": stack_outputs_list
            }
            print(f"stack_results: {stack_results}")
            stacks_results.append(stack_results)
            print(f"stacks_results: {stacks_results}")

    return(stacks_results)

# The important thing that has to be addressed when returning the existing deployments is
# that if I have a deployment named BigDeployment which actually deploys two projects/stacks,
# and one or both of those project are also represented by a small single-project deployment, 
# then I don't want the smaller single-project deployments to be presented as deployments
# that can be destroyed.
# I only want to present the "BigDeployment" deployment so destroying it will handle things in the
# correct order.
def get_existing_deployments():
    existing_deployments = []
    existing_stacks = []
    # Get the raw deployment options including the related projects from the deployment options json file
    deployment_options_projects = list(get_deployment_options_array())
    # Sort this based on the number of projects for each deployment option from most to least.
    # This will enable logic below to avoid returning deployment options that are actually stacks that are part of multi-stack deployments.
    deployment_options_projects.sort(key=lambda x: len(list(x["projects"])), reverse=True)
    print("sorted deployment options", deployment_options_projects)
    for deployment_option_projects in deployment_options_projects:
        deployment_option = deployment_option_projects["name"]
        deployment_projects = deployment_option_projects["projects"]
        for deployment_project in deployment_projects:
            # Set project_dir for the requested project
            project_base_dir = get_project_base_dir()
            project_dir = os.path.join(os.path.dirname(__file__), project_base_dir, deployment_project) 
            ws = auto.LocalWorkspace(project_dir)
            stacks = ws.list_stacks()
            for stack in stacks:
                if (stack.resource_count > 0):
                    existing_stack = f'{deployment_project}/{stack.name}'
                    existing_deployment = f'{deployment_option}/{stack.name}'
                    if (existing_stack not in existing_stacks):
                        existing_stacks.append(existing_stack)
                        if (existing_deployment not in existing_deployments):
                            # If we have a deployment that uses two projects, given that we sorted biggest to smallest, that second project won't be noted as an existing deployment.
                            existing_deployments.append(existing_deployment)
    return(existing_deployments)

