import json
import pulumi
from pulumi_aws import iam

# Create a trust policy
trust_policy = pulumi.Output.from_input({
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {
            "Service": "ec2.amazonaws.com"
        },
        "Action": "sts:AssumeRole",
    }]
})

# bucket policy that will be added in-line
bucket_policy_doc = json.dumps({
    'Version': '2012-10-17',
    'Statement': [{
        'Action': ['s3:ListBucket'],
        'Effect': 'Allow',
        'Resource': '*'
    }]
})

# Create an AWS IAM role using the trust policy and an inline bucket policy
role = iam.Role("myRole",
                assume_role_policy=trust_policy, 
                inline_policies=[
                  iam.RoleInlinePolicyArgs(
                    name="s3bucket_policy_inline",
                    policy=bucket_policy_doc,
                  )
                ])


# Add an ec2 policy as an attachment
ec2_policy_doc = pulumi.Output.from_input({
    'Version': '2012-10-17',
    'Statement': [{
        'Action': ['ec2:*'],
        'Effect': 'Allow',
        'Resource': '*'
    }]
})
ec2_policy = iam.Policy('ec2_policy', policy=ec2_policy_doc)
ec2_policy_attachment = iam.RolePolicyAttachment('ec2_rolePolicyAttachment',
                                             policy_arn=ec2_policy.arn, 
                                             role=role.id)

# Get the predefined admin access policy and attach it 
adminaccess_policy_arn = iam.get_policy(name="AdministratorAccess").arn
policy_attachment = iam.RolePolicyAttachment('admin_rolePolicyAttachment',
                                             policy_arn=adminaccess_policy_arn,
                                             role=role.id)

# Export the name of the role
pulumi.export('role_name', role.id)
