# Pulumi Webhook Using Azure Functions

This Pulumi project creates an Azure Function that can the be used as a webhook in the Pulumi Service.  
The code in this project takes the information sent by the Pulumi service (through the aforementioned webhook) and forwards it to a Slack channel via a Slack Webhooks.  
We are creating a web of webhooks here. Which is better than a web of lies.

## Running the App

1.  Create a new stack:

    ```
    $ pulumi stack init dev
    ```

1.  Login to Azure CLI (you will be prompted to do this during deployment if you forget this step):

    ```
    $ az login
    ```

1.  Restore NPM dependencies:

    ```
    $ npm install
    ```
    
1. Set the Azure region location to use:
    
    ```
    $ pulumi config set azure-native:location westus2
    ```

1. Set the Slack webhook for the function to forward messages to.
    ```
    $ pulumi config set slackWebhookUrl --secret
    value: ENTER YOUR SLACK WEBHOOK URL 
    ```

1.  Run `pulumi up` to preview and deploy changes:

    ```
    $ pulumi up
    Previewing changes:
    ...

    Performing changes:
    ...
    Resources:
        + 8 created

    Duration: 1m18s
    ```

1.  Check the deployed endpoint:
    Note: The response from the curl is just an error handling message. When plugged into the Pulumi Service as a webhook there, stack updates will generate messages in the given Slack channel

    ```
    $ pulumi stack output endpoint
    https://appg-fsprfojnnlr.azurewebsites.net/api/SlackHandler
    $ curl "$(pulumi stack output endpoint)"
    No message body received.
    ```
