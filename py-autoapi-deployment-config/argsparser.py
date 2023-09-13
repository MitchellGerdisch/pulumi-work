import argparse

# Build the command line arguments
# NOTE: Defaults can be added for things like awsoidc, github_repo, etc by following the pattern seen for the org argument
def create_parser():
  parser = argparse.ArgumentParser(description="Pulumi stack management.",
                                  formatter_class=argparse.ArgumentDefaultsHelpFormatter)
  parser.add_argument("-d", "--destroy", action="store_true", help="Remove the deployment settings.")
  parser.add_argument("-D", "--debug", action="store_true", help="Enable any debug output settings.")
  parser.add_argument("-o", "--org", nargs="?", default="PUTDEFAULTORGHERE", help="Name of organization in which the stacks reside.")
  parser.add_argument("-t", "--tenant", required=True, help="Name of tenant for which the deployment is being created.")
  parser.add_argument("-a", "--awsoidc", required=True, help="OIDC role arn for deployments to use when talking to AWS.")
  parser.add_argument("-r", "--github_repo", nargs="?", default="GITHUBORG/GITHUBREPO", help="Github repo where the projects are stored.")
  parser.add_argument("-g", "--github_token", required=True, help="GITHUB access token with access to the vnext-tenants repo.")

  return parser
