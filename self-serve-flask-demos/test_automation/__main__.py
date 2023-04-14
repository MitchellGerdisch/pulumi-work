from pulumi_demos_integration.automate.stack_utils import update_stack

org = "MitchGerdisch"
project = "test-project"
stack = "dev"
stack_outputs = update_stack(org, project, stack, False)
print(f"main stack outputs: {stack_outputs}")
