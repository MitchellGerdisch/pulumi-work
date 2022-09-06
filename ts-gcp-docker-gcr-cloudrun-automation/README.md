# Docker Build and Push to GCR and Deploy to Google Cloud Run using separate projects and/or Automation API

An example of building a custom Docker image and pushing it into a Google Cloud Container Registry and then in a separate project deploying that image with the Google Cloud Run service using TypeScript.

## Prerequisites

1. [Ensure you have the latest Node.js and NPM](https://nodejs.org/en/download/)
2. [Install the Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
3. [Configure Pulumi to access your GCP account](https://www.pulumi.com/docs/intro/cloud-providers/gcp/setup/)
4. [Install Docker](https://docs.docker.com/install/)
5. Enable Docker to deploy to Google Container Registry with `gcloud auth configure-docker`
6. [Setup Docker auth with a JSON key to get image from GCR](https://cloud.google.com/container-registry/docs/advanced-authentication#json-key)

## Run Stacks 
Stacks can be run individually or via automation API.

1. Navigate to the `docker-build-push-gcr` directory

1. Restore NPM dependencies:

    ```
    $ npm install
    ```

1. Navigate to the `cloud-run-deploy` directory

1. Restore NPM dependencies:

    ```
    $ npm install
    ```

1. Navigate to the `automation` directory

1. Run automation program:

   ```
   $ npm run projects STACKNAME
   ```
   where STACKNAME is a stack name (e.g. dev)

1. To destroy run:
   ```
   $ npm run projects destroy
   ```
