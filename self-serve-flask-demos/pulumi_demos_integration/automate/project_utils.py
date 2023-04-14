import os
import subprocess
import yaml

# Returns array of the deployment options given in the deployment_options json file
def get_deployment_options(arrangements_file: str):

  # Open the arrangements file to produce a list of options for the UI.
  with open(arrangements_file) as f:
      arrangements_config = yaml.safe_load(f)
  f.close()

  arrangements_names = []
  for arrangement in arrangements_config["arrangements"]:
    arrangements_names.append(arrangement["name"])

  return(arrangements_names)
  