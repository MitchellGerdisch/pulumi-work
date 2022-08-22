from pulumi import automation as auto
from pulumi_orch.automate.project_utils import prep_workspace
import sys
import json
import os

def update_stack(org: str, project: str, stack: str, destroy: bool):

    # Set project_dir for the requested project
    project_dir = os.path.join(os.path.dirname(__file__), "..", "projects", project) 
    print("project_dir", project_dir)

    # Set up the environment for the pulumi project/stack
    prep_workspace(project_dir, "python")

    stack_name = f"{org}/{stack}"
    # Create our stack using a local program in the ../aws-py-voting-app directory
    stack = auto.create_or_select_stack(stack_name=stack_name, work_dir=project_dir)
    print("successfully initialized stack")

    print("setting up config")
    stack.set_config("azure-native:location", auto.ConfigValue(value="CentralUS"))
    print("config set")

    print("refreshing stack")
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
    print(f"stack outputs: {up_res.outputs}")
    stack_results = {
        "name": stack_name,
        "outputs": up_res.outputs
    }
    return(stack_results)

# def get_stacks():

