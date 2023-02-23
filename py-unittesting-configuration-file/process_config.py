# I'm not good enough with `jq` to process the output of `pulumi config --json --show-secrets --stack STACKNAME` to produce
# a PULUMI_CONFIG environment variable that can be consumed by unit testing.
# See bottom of file for more information
#

# Input: The output of `pulumi config --json --show-secrets`
# Output: config json of form: { "key":"value" }

import argparse
import json
import sys

# Build the command line arguments
def create_parser():
  parser = argparse.ArgumentParser(description="Pulumi config processor.",
                                  formatter_class=argparse.ArgumentDefaultsHelpFormatter)
  parser.add_argument("-c", "--config", required=True, help="JSON output from `pulumi config --json --show-secrets`.")
  return parser

parser = create_parser()
args = parser.parse_args()
config_json = json.loads(args.config)
new_config_json = {}
for key in config_json:
  new_config_json[key] = config_json[key]['value']

sys.stdout.write(json.dumps(new_config_json))
sys.stdout.flush
sys.exit(0)

#
# Notes on processing the config
# `pulumi config --json --show-secrets` will produce something like this:
# {
#   "gcp:project": {
#     "value": "pulumi-ce-team",
#     "secret": false
#   },
#   "python-unit-testing:byte_length": {
#     "value": "8",
#     "secret": false
#   },
#   "python-unit-testing:goo": {
#     "value": "secretfoo",
#     "secret": true
#   }
# }
# And I need it to end up looking like:
# {
#    "gcp:project": "pulumi-ce-team",
#    "project:byte_length": "8",
#    "project:goo": "secretfoo"
#
# }
# This can then be export in $PULUMI_CONFIG and unit testing can work as expected.
#
