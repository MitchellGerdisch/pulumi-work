import pulumi_orch.automate.stack_utils as stack_utils

org = "MitchGerdisch"
project = "test-project"
stack = "dev"
stack_outputs = stack_utils.update_stack(org, project, stack, False)
print(f"main stack outputs: {stack_outputs}")
