# A little program to create a bunch of stacks to test the stack_management code with.
# Passing the -d option will destory the stacks.
import argparse
import os
import pulumi
from pulumi import automation as auto
from stacks_base_properties import stack_properties

def fake_program():
    # Gather up the settings for the deployment configuration
    pulumi.export("Nothing burger")

def create_params_parser():
  parser = argparse.ArgumentParser(description="Pulumi stack management tester.",
                                  formatter_class=argparse.ArgumentDefaultsHelpFormatter)
  parser.add_argument("-d", "--destroy", action="store_true", help="Remove the deployment settings.")
  parser.add_argument("-dd", "--destroy_and_remove", action="store_true", help="Destroys AND removes the stacks created by the test code.")
  parser.add_argument("-o", "--org", nargs="?", default="portx", help="Name of organization in which the stacks reside.")
  parser.add_argument("-t", "--tenant", required=True, help="Name of tenant for which the deployment is being created.")
  return parser

params_parser = create_params_parser()
args = params_parser.parse_args()
org = args.org
tenant = args.tenant
destroy = args.destroy
destroy_and_remove = args.destroy_and_remove

existing_stacks_file = "existing_stacks.json"
existing_stacks = []
for stack_info in stack_properties:
    tenant_project_name = f'{tenant}-{stack_info["project_basename"]}'
    tenant_stack_name = auto.fully_qualified_stack_name(org, tenant_project_name, stack_info["stack_name"])
    print(f"Create or select stack: {tenant_stack_name}")
    test_stack=auto.create_or_select_stack(stack_name=tenant_stack_name, project_name=tenant_project_name, program=fake_program)
    if destroy or destroy_and_remove: 
      print(f"Destroying stack: {tenant_stack_name}")
      test_stack.destroy(on_output=print)
      if destroy_and_remove:
        print(f"Removing stack: {tenant_stack_name}")
        os.system(f"pulumi stack rm {tenant_stack_name} --yes")

 