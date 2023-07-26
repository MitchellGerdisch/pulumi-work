# AWS Resources Using AssumeRole

This example shows how to use the AssumeRole functionality of the AWS provider
to create resources in the security context of an IAM Role assumed by the IAM
User running the Pulumi programs.

# Mitch Notes
Referencing https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_cross-account-with-roles.html  

The big picture is that users in the main (development) account are given permission to create an eks cluster in the target (production) account.

Walking through the tutorial steps with pulumi automation steps noted below.
* Step 1: done manually - see notes and related settings and values below for related information
* Step 2: done manually - added the assume role policy to the `demos_weekly_test` user we have in the account
* Step 2.1: test
  * `aws sts assume-role --role-arn "arn:aws:iam::420942475186:role/mitch-assumerole-test-role" --role-session-name "AssumeRoleTest"`
* Step 2.2: In the "Production" account add the permissions (and remove any of the permissions you may have added during the Steps 1 and 2)
* Step 3: Use the project in this folder to try and create eks and related resources in the "Production" account.

Notes, settings and values used while going through the AWS tutorial referenced above.
* Development Account: pulumi-ce (052848974346)
  * OPTION 1: create/use a IAM user
    * User: demos_weekly_test
  * OPTION 2: Use one's SSO login
    * User: the ARN from the output of `aws sts get-caller-identity` is used below in the trust relationship policy for the mitch-assumerole-test-role in "Production Account". See below
* Production Account" pulumi-ce-workshops (420942475186)
  * policy: mitch-assumerole-test (see managed policy definition below)
    * managed policy definition - this is very broad but covers the gamut of action sets that are needed.  
      TODO: Refine the permissions needed for each item (e.g. "eks":WHATEVER)
      ```
      {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "eks:*",
                    "iam:*",
                    "ec2:*",
                    "ssm:GetParameter*",
                    "secretsmanager:*",
                    "autoscaling:*",
                    "cloudformation:*"
                ],
                "Resource": "*"
            }
        ]
      }
      ```
  * role: mitch-assumerole-test-role
    * ARN: arn:aws:iam::420942475186:role/mitch-assumerole-test-role
    * Trust relationship policy:
      ```
      {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              # PICK ONE AND REMOVE THE OTHER WHEN CREATING THE POLICY. See above about the OPTIONs
              # OPTION 1: This is just the ARN of an IAM user 
              "AWS": "arn:aws:iam::052848974346:user/demos_weekly_test"
              # OPTION 2: This is obtained for the user that is going to be running `pulumi up` by using `aws sts get-caller-identity`
              "AWS": "arn:aws:sts::XXXXXXXX:assumed-role/AWSReservedSSO_AdministratorAccess_YYYYYYYYYY/USER@COMPANY.com"
            },
            "Action": "sts:AssumeRole",
            "Condition": {}
          }
        ]
      }
      ```
* Development account
  * Permissions setting 
    ```
    {
      "Version": "2012-10-17",
      "Statement": {
        "Effect": "Allow",
        "Action": "sts:AssumeRole",
        "Resource": "arn:aws:iam::420942475186:role/mitch-assumerole-test-role"
      }
    }
    ```


## Deploying the Example

### Set Up

* Option 1: Using the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY for the IAM user in the "Development" account you set up the assume role for:
  ```bash
  export AWS_ACCESS_KEY_ID=<ACCESS_KEY>
  export AWS_SECRET_ACCESS_KEY=<SECRET_KEY>
  unset AWS_SESSION_TOKEN
  ```
* Option 2: SSO login
* Set the stack configuration
  ```bash
  pulumi stack init dev
  pulumi config set aws:region us-west-2
  pulumi config set --path aws:assumeRole.roleArn arn:aws:iam::420942475186:role/mitch-assumerole-test-role
  ```
* Run the program
  ```bash
  pulumi up
  ```
* Login to the "Production" account and see that an object was added to the bucket.

### Clean up

To clean up your resources, run `pulumi destroy` and respond yes to the
confirmation prompt.

[app]: https://app.pulumi.com/