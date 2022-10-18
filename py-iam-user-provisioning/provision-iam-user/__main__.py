"""An AWS Python Pulumi program"""

import pulumi
import pulumi_command as command
from iam_user import IamUser, IamUserArgs


config = pulumi.Config()
slack_webhook_url = config.get_secret("slackWebhookUrl")
users = config.require_object("users")

created_users = []

for user in users:

  user_name = user["name"]

  iam_user = IamUser(user_name, IamUserArgs(
    user_name=user_name,
    user_path=user["path"],
    user_policy="""{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": [
            "ec2:Describe*"
          ],
          "Effect": "Allow",
          "Resource": "*"
        }
      ]}"""))

  send_creds = command.local.Command(f"{user_name}-send-creds",
    dir=".",
    environment={
      "USERNAME": iam_user.name,
      "USERPASSWORD": iam_user.password,
      "USERACCESSKEYID": iam_user.access_key_id,
      "USERSECRETACCESSKEY": iam_user.secret_access_key,
      "SLACK_WEBHOOK": slack_webhook_url
    },
    # create='echo "${USERNAME}:${USERPASSWORD}:${USERACCESSKEYID}:${USERSECRETACCESSKEY}" >> pretend_slack_channel.txt',
    # delete='echo "${USERNAME} DELETED" >> pretend_slack_channel.txt'
    create='./slack_notify.sh  "USER CREATED: ${USERNAME}; password: ${USERPASSWORD}; ACCESS_KEY_ID: ${USERACCESSKEYID}; SECRET_ACCESS_KEY: ${USERSECRETACCESSKEY}"',
    delete='./slack_notify.sh  "USER DELETED: ${USERNAME}"'
  )

  user_info = {
    "name": iam_user.name,
    "arn": iam_user.arn,
    "access_key_id": iam_user.access_key_id,
    "secret_access_key": iam_user.secret_access_key,
    "password": iam_user.password,
  }
  created_users.append(user_info)

pulumi.export("user_info", created_users)

