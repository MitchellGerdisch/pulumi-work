# AWS Resources Using AssumeRole

This example shows how to use the AssumeRole functionality of the AWS provider
to create resources in the security context of an IAM Role assumed by the IAM
User running the Pulumi programs.

# Mitch Notes
Referencing https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_cross-account-with-roles.html  

Walking through the tutorial steps with pulumi automation steps noted below.
* Step 1: done manually - see notes and related settings and values below for related information
* Step 2: done manually - added the assume role policy to the `demos_weekly_test` user we have in the account
* Step 2.5: test
  * `aws sts assume-role --role-arn "arn:aws:iam::420942475186:role/mitch-assumerole-test-role" --role-session-name "AssumeRoleTest"`
  * 
* Step 3: Used the assume-role project in this folder to try and create an object in the bucket

Notes, settings and values used while going through the AWS tutorial referenced above.
* Development Account: pulumi-ce (052848974346)
  * User: demos_weekly_test
* Production Account" pulumi-ce-workshops (420942475186)
  * bucket: mitch-assumerole-test
  * policy: mitch-assumerole-test (see managed policy definition below)
    * managed policy definition - **NOTE: had to add `GetObjectTagging` permission to appease the AWS provider.**
      ```
      {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": "s3:ListAllMyBuckets",
            "Resource": "*"
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:ListBucket",
              "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::mitch-assumerole-test"
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:GetObjectTagging",
              "s3:PutObject",
              "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::mitch-assumerole-test/*"
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
              "AWS": "arn:aws:iam::052848974346:user/demos_weekly_test"
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

* Using the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY for the IAM user in the "Development" account you set up the assume role for:
  ```bash
  export AWS_ACCESS_KEY_ID=<ACCESS_KEY>
  export AWS_SECRET_ACCESS_KEY=<SECRET_KEY>
  unset AWS_SESSION_TOKEN
  ```
* Set the stack configuration
  ```bash
  pulumi stack init dev
  pulumi config set roleToAssumeARN arn:aws:iam::420942475186:role/mitch-assumerole-test-role # FROM ABOVE
  pulumi config set aws:region us-west-2
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