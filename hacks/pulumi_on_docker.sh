#!/bin/sh

# A little hack that allows you to run other versions of Pulumi easily.
# Run it from the folder containing your pulumi code and environment.
# It will crank up a docker container which is mounted to that folder and put you in the shell for the container.
# From there you can run pulumi.
# When done enter "exit"
#
# INPUTS
# $1 (optional) -> the version of the Pulumi CLI you want to run. Default: latest version.
# 
# REQUIREMENTS
# Requires Docker installed and running on your workstation.
#


pulumi_docker () {
    VERSION="latest"
    if [ ${1} ] 
    then
        VERSION=${1}
    fi
    echo "Using pulumi version ${VERSION}"
    ENVFILE='pulumi-docker.env'
    echo "Writing Pulumi token to [${ENVFILE}]..."
    echo "PULUMI_ACCESS_TOKEN=$(jq -r '.accessTokens["https://api.pulumi.com"]' ~/.pulumi/credentials.json)" >> ${ENVFILE}
    echo "Writing AWS credentials to [${ENVFILE}]..."
    AWSKEYFILE=~/.aws/credentials
    echo "AWS_ACCESS_KEY_ID=$(grep aws_access_key_id $AWSKEYFILE | cut -d"=" -f2 | sed 's/ *//g')" >> ${ENVFILE} 
    echo "AWS_SECRET_ACCESS_KEY=$(grep aws_secret_access_key $AWSKEYFILE | cut -d"=" -f2 | sed 's/ *//g')" >> ${ENVFILE} 
    echo "Passing env file [${ENVFILE}] to Docker..."
    if [ ${VERSION} == "latest" ]
    then
        docker pull pulumi/pulumi:${VERSION} # grab the latest version of latest
    fi
    docker run -it --env-file ${ENVFILE} -w /workspace -v $(pwd):/workspace --entrypoint /bin/bash pulumi/pulumi:${VERSION}
    echo "Removing file [${ENVFILE}]..."
    rm ${ENVFILE}
}

echo "You can pass a specific pulumi version as a parameter, e.g. \"2.10.2\". Otherwise \"latest\" is used."
pulumi_docker ${1}
