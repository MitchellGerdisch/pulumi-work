import argparse

# Build the command line arguments
def create_parser():
  parser = argparse.ArgumentParser(description="Pulumi stack management.",
                                  formatter_class=argparse.ArgumentDefaultsHelpFormatter)
  # parser.add_argument("-a", "--account", action="store_true", default=True, help="Set up deployment for the given tenant's account project.")
  # parser.add_argument("-c", "--core", action="store_true", default=True, help="Set up deployment for the given tenant's core project. Must also provide -s option.")
  parser.add_argument("-d", "--destroy", action="store_true", help="Remove the deployment settings.")
  parser.add_argument("-D", "--debug", action="store_true", help="Enable any debug output settings.")
  # parser.add_argument("-e", "--edge", action="store_true", default=True, help="Set up deployment for the given tenant's edge project. Must also provide -s option.")
  # parser.add_argument("-g", "--github", action="store_true", default=True, help="Set up deployment for the given tenant's github project.")
  parser.add_argument("-o", "--org", nargs="?", default="portx", help="Name of organization in which the stacks reside.")
  # parser.add_argument("-r", "--route53", action="store_true", default=True, help="Set up deployment for the given tenant's route53 project.")
  # parser.add_argument("-s", "--stacks",  default="dev,stg,prod", help="Comma-separated list of stack names (e.g. dev,prod)")
  parser.add_argument("-t", "--tenant", required=True, help="Name of tenant for which the deployment is being created.")
  parser.add_argument("-a", "--awsoidc", required=True, help="OIDC role arn for deployments to use when talking to AWS.")
  parser.add_argument("-r", "--github_repo", required=True, help="Github repo where the projects are stored.")
  parser.add_argument("-g", "--github_token", required=True, help="GITHUB access token with access to the vnext-tenants repo.")

  return parser
