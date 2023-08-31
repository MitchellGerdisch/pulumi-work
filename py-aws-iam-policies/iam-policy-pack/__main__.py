import json
from pulumi_policy import (
    EnforcementLevel,
    PolicyPack,
    ReportViolation,
    ResourceValidationArgs,
    ResourceValidationPolicy,
)

def iam_trust_policy_validator(args: ResourceValidationArgs, report_violation: ReportViolation):
    ## helpful to see what the inputs look like when working on policies
    # print("type", args.resource_type)
    # print("props", json.dumps(list(args.props)))
    # In python policies, you need to use the camelCase version of the property name
    if args.resource_type == "aws:iam/role:Role" and "assumeRolePolicy" in args.props:
        assume_role_policy = json.loads(args.props["assumeRolePolicy"])
        # print("assume_role_policy", assume_role_policy)
        assume_role_policy_statement = assume_role_policy["Statement"][0]
        if assume_role_policy_statement["Action"] == "sts:AssumeRole" and assume_role_policy_statement["Effect"] == "Allow":
            report_violation(
                "Don't be assuming any Allows, y'all"
                f"\nHere is the problematic assume role statement:\n{assume_role_policy_statement}"
            )

def iam_inline_policy_validator(args: ResourceValidationArgs, report_violation: ReportViolation):
    ## helpful to see what the inputs look like when working on policies
    # print("type", args.resource_type)
    # print("props", json.dumps(list(args.props)))
    # In python policies, you need to use the camelCase version of the property name
    if args.resource_type == "aws:iam/role:Role" and "inlinePolicies" in args.props:
        inline_policies = list(args.props["inlinePolicies"])
        for item in inline_policies:
            inline_policy = dict(item)
            if "s3" in json.dumps(inline_policy):
                report_violation(
                    "No s3 policies are allowed"
                    f"\nHere is the problematic policy statement:\n{inline_policy}"
                )

def iam_policy_validator(args: ResourceValidationArgs, report_violation: ReportViolation):
    if args.resource_type == "aws:iam/policy:Policy":
        policy = args.props["policy"]
        if "ec2" in json.dumps(policy):
            report_violation(
                "No ec2 policies are allowed"
                f"\nHere is the problematic policy statement:\n{policy}"
            )

def iam_role_policy_attachment_validator(args: ResourceValidationArgs, report_violation: ReportViolation):
    if args.resource_type == "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
        policy_arn = args.props["policyArn"]
        if "admin" in policy_arn.lower():
            report_violation(
                "No admin policies can be attached to a role"
                f"\nHere is the arn of the problematic policy:\n{policy_arn}"
            )

iam_role_trust_policy_check = ResourceValidationPolicy(
    name="role-trust-policy-check",
    description="Checks a role's trust policy for stuff.",
    validate=iam_trust_policy_validator
)

iam_role_inline_policy_check = ResourceValidationPolicy(
    name="role-inline-policy-check",
    description="Checks a role's inline policy for stuff.",
    validate=iam_inline_policy_validator
)

iam_policy_check = ResourceValidationPolicy(
    name="policy-check",
    description="Checks a policy for stuff.",
    validate=iam_policy_validator
)

iam_role_policy_attachment_check = ResourceValidationPolicy(
    name="role-policy-attachment-check",
    description="Checks attached policies for stuff.",
    validate=iam_role_policy_attachment_validator
)


PolicyPack(
    name="aws-iam-checks",
    enforcement_level=EnforcementLevel.MANDATORY,
    policies=[
        iam_role_trust_policy_check,
        iam_role_inline_policy_check,
        iam_policy_check,
        iam_role_policy_attachment_check,
    ],
)
