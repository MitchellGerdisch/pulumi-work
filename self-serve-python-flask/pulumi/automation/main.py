import os
from stack_utils import update_stack

project_dir = os.path.join(os.path.dirname(__file__), "..", "projects", "test-project")
org = "MitchGerdisch"
stack = "dev"
stack_outputs = update_stack(project_dir, org, stack, False)
print(f"main stack outputs: {stack_outputs}")
