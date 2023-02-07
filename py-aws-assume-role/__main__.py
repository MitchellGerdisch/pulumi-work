# Assumes you did Steps 1 and 2 from https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_cross-account-with-roles.html
# This project changes some of the names, etc and basically replaces step 3 to use Pulumi to use the assumed role.

import pulumi_aws as aws
from pulumi import Config, ResourceOptions, export, FileAsset

config = Config()
role_to_assume_arn = config.require('roleToAssumeARN')
other_account_bucket = config.require('otherAccountBucket')
aws_config = Config('aws')

provider = aws.Provider(
    'privileged',
    assume_role=aws.ProviderAssumeRoleArgs(
        role_arn=role_to_assume_arn,
        session_name="Pulumi",
    ),
    region=aws_config.require('region')
)

example_bucket_object = aws.s3.BucketObject("exampleBucketObject",
    key="assumeroleobjecttest",
    bucket=other_account_bucket,
    source=FileAsset("Pulumi.yaml"),
    opts=ResourceOptions(provider=provider)
)

export('object_id', example_bucket_object.id)
