# Pulumi Service Audit Logs S3 Export Project

This project deploys an AWS S3 bucket and IAM Role with the permissions needed to work with the Pulumi Service
Audit Logs export capability.
See: https://www.pulumi.com/docs/intro/console/audit-logs/#automated-export 

This project also includes a dynamic provider to configure the Pulumi Service audit log export automatically.

## Deploying and running the program

1.  Create a new stack:

    ```bash
    $ pulumi stack init auditlog-export
    ```

1.  Set the AWS region:

    ```
    $ pulumi config set aws:region us-east-1
    ```

1. Set the pulumi org configuration
    ```
    $ pulumi config set orgName acmeorg
    ```

1.  Restore NPM modules via `npm install` or `yarn install`.

1.  Run `pulumi up` to preview and deploy changes:

    ```
    $ pulumi up
    ```


## Clean up

1.  Run `pulumi destroy` to tear down all resources.

1.  To delete the stack itself, run `pulumi stack rm`. Note that this command deletes all deployment history from the Pulumi Console.
