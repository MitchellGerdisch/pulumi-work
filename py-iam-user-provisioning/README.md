# IAM User Provisioning Example
Demonstrates the following concepts:
* Structured config is used to define users to create.
* Secrets management is used in config and outputs.
* Component resource is used to abstract the various resources needed to create an IAM user.
* Main code uses a for-loop over the users in the config data to create each user.
* Uses command provider to send a message to a slack channel using a Slack Webhook URL.