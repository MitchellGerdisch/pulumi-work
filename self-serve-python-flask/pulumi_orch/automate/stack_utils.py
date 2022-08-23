from pulumi import automation as auto
from pulumi_orch.automate.project_utils import get_deployment_projects, prep_workspace, get_project_base_dir
import sys
import json
import os

def update_stack(org: str, deployment_option: str, env: str, destroy: bool):

    print("deployment option: ", deployment_option)
    print("env: ", env)
    # Get the projects for the requested deployment_option
    projects = get_deployment_projects(deployment_option)
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

def get_current_stacks():
    current_stacks = [
    ]
    return(current_stacks)

