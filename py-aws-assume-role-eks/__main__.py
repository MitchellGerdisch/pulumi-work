# Assumes you did Steps 1 and 2 from https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_cross-account-with-roles.html
# BUT with permissions for deploying with pulumi_eks package - see the README.
# It also uses the default provider.

import pulumi_aws as aws
from pulumi import Config, ResourceOptions, export, FileAsset
import pulumi_eks as eks

aws_config = Config('aws')
assume_role_config = aws_config.get_object("assumeRole")
assume_role_arn = assume_role_config.get("roleArn")

eks_cluster = eks.Cluster("myeks", 
                          # This is needed for the resources that use kubeconfig to configure things like storageClass
                          provider_credential_opts=eks.KubeconfigOptionsArgs(
                              role_arn=assume_role_arn
                          ))
                        