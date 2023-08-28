import os
import requests

# Uses Pulumi Search API to search for resources and return the resources all their properties.
# TODO: Leverage the cursor property to manage the case if more than 10,000 resources are returned.
# - NOTE If the number of resources exceeds 10,000 you will want to modify the query to use cursor to paginate the results.
#   SEE: https://www.pulumi.com/docs/pulumi-cloud/cloud-rest-api/#parameters-33

# PREREQUSITES
# - Set environment variable, PULUMI_ACCESS_TOKEN, to an access token with access to the Pulumi org you are searching in
# - Set environment variable, PULUMI_ORG, to your pulumi org you are searching in

# HOW TO USE
# Define a query you want to send if no query is given then ALL resources and ALL their properties will be returned.
# - HELPFUL HINT: Use Pulumi Cloud UI to figure out the query you want to send. The Search AI feature helps with this as well.

# EXAMPLE QUERY THAT FINDS RESOURCES FOR A GIVEN PROJECT AND STACK.
# If you want to find resources for all the stacks for a given project, just remove the "stack:dev" part.
# Other queries can be discovered in the Pulumi cloud UI by selecting predefined queries or asking the AI to find stuff and copy/pasting the resultant query.
query="project:MYPROJECTNAME stack:dev"

pulumi_access_token = os.getenv("PULUMI_ACCESS_TOKEN") or print("PULUMI_ACCESS_TOKEN environment variable not set")
pulumi_org = os.getenv("PULUMI_ORG") or print("PULUMI_ORG environment variable not set")

headers = {
  'Accept': 'application/json',
  'Authorization': f"token {pulumi_access_token}"
}

# r = requests.get(f"https://api.pulumi.com/api/orgs/{pulumi_org}/search/resources?properties=true&query=project:deployment-lambda-eventbridge-dyndb stack:dev", headers = headers)
r = requests.get(f"https://api.pulumi.com/api/orgs/{pulumi_org}/search/resources?properties=true&query={query}", headers = headers)
results_json = r.json()

print("#####")
print("Found this many resources: ", results_json["total"])
print("### FULL JSON OUTPUT FOLLOWS ###")
print(results_json)
