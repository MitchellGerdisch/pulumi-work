# Serverless REST API for Pulumi Webhook Demos

This project deployes a simple REST API that can be used as a payload URL for a Pulumi webhook.

It exposes a POST method and stores the payload in a DynamoDB table. It will also store any query parameters that are passed as part of the URL.

## Deploying and running the program

1.  Create a new stack:

    ```bash
    $ pulumi stack init webhook-api
    ```

1.  Set the AWS region:

    ```
    $ pulumi config set aws:region us-east-1
    ```

1.  Restore NPM modules via `npm install` or `yarn install`.

1.  Run `pulumi up` to preview and deploy changes:

    ```
    $ pulumi up
    ```

1.  Use the provided Webhook URL (see stack outputs) in the Pulumi console to set up the webhook.
1.  Update a stack or otherwise cause webhook delivery activity.
1.  Go to the provided "Dump Log Data" URL (see stack outputs) to get a dump of the data. Or, go to the DynamoDB table (see stack outputs or resources) in AWS.

## Clean up

1.  Run `pulumi destroy` to tear down all resources.

1.  To delete the stack itself, run `pulumi stack rm`. Note that this command deletes all deployment history from the Pulumi Console.
