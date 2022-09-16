#!/bin/sh

if [ $# -ne 3 ]
then
  echo "USAGE: $0 PRIVATE_TOKEN PROJECT_ID MR_IID" 
  exit 1
fi

token=${1}
project_id=${2}
mr_iid=${3}
mr_thread_id=${4}

project_api_url="https://gitlab.com/api/v4/projects/${project_id}"
mr_api_url="${project_api_url}/merge_requests/${mr_iid}"

# The backticks are needed to keep the formatting.
body="\`\`\``pulumi preview --diff`"
curl --header "PRIVATE-TOKEN: ${token}" \
  --request POST \
  --form "body=${body}"\
  ${mr_api_url}/discussions
  # https://gitlab.com/api/v4/projects/${project_id}/merge_requests/${mr_iid}/discussions