import pulumi_aws as aws
import pulumi
from pulumi import Config, ResourceOptions, export, FileAsset, Output
import json

#### Function to return an assumed role policy
def assume_role_policy_for_principal(principal):
    """
    assume_role_policy_for_principal returns a well-formed policy document
    which can be used to control which principals may assume an IAM Role, by
    granting the `sts:AssumeRole` action to those principals.
    """
    return Output.json_dumps({
        'Version': '2012-10-17',
        'Statement': [
            {
                'Sid': 'AllowAssumeRole',
                'Effect': 'Allow',
                'Principal': principal,
                'Action': 'sts:AssumeRole'
            }
        ]
    })

### Get the current user's information
# This "user" will be allowed to assume the role we create below.
caller_identity = aws.get_caller_identity()

### Create a new role to assume and use it to do the work ###
# Create the IAM role
role_to_assume = aws.iam.Role("role_to_assume", aws.iam.RoleArgs(
    assume_role_policy=assume_role_policy_for_principal({'AWS': caller_identity.arn})
))

### Create the policy to allow the assumed role to use the applicable AWS resources.
# S3 in this case
assumed_policy = aws.iam.RolePolicy('allow-s3-management-policy',
    role=role_to_assume,
    policy=json.dumps({
        'Version': '2012-10-17',
        'Statement': [{
            'Sid': 'AllowS3Management',
            'Effect': 'Allow',
            'Resource': '*',
            'Action': 's3:*',
        }],
    }),
    # opts=ResourceOptions(parent=allow_s3_management_role)
)


# # Attach the policy to the role
# assumed_policy_attachment = aws.iam.RolePolicyAttachment(
#     "role-policy-attachment", role=role.name, policy_arn=policy.arn
# )


# privileged_provider = pulumi.Output.all(assumed_role.arn, assumed_policy.arn).apply(assume_role)

### Use the assumed role to create an AWS provider and use it to create a bucket
assumed_provider = aws.Provider(
    'privileged',
    assume_role= aws.ProviderAssumeRoleArgs(
        role_arn="arn:aws:iam::052848974346:role/role_to_assume-e00b41c", 
        # session name can contain only the following special characters =,.@-
        # if any other special character is used, an error stating that the role
        # cannot be assumed will be returned
        session_name='PulumiSession',
    ),
    ## region="us-west-2"
    region=Config("aws").require("region")
)

# Create the new S3 bucket using the assumed role
bucket = aws.s3.Bucket(
    "myBucket",
    acl="private",
    versioning={"enabled": True},
    opts=pulumi.ResourceOptions(provider=assumed_provider),
)

# instance = aws.iot.Thing("my-thing", aws.iot.ThingArgs(),
#     opts=pulumi.ResourceOptions(provider=assumed_provider),
# )

# Export bucket name
pulumi.export("bucketName", bucket.id)
pulumi.export("assumed_role", role_to_assume.arn)


