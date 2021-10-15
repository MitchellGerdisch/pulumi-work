import * as aws from "@pulumi/aws";
import { PolicyPack, validateResourceOfType } from "@pulumi/policy";

const nameBase = "mitch"
new PolicyPack(`${nameBase}-policypack`, {
    policies: [{
        name: "s3-no-public-read",
        description: "Prohibits setting the publicRead or publicReadWrite permission on AWS S3 buckets.",
        enforcementLevel: "mandatory",
        validateResource: validateResourceOfType(aws.s3.Bucket, (bucket, args, reportViolation) => {
            if (bucket.acl === "public-read" || bucket.acl === "public-read-write") {
                reportViolation(
                    "You cannot set public-read or public-read-write on an S3 bucket. " +
                    "Read more about ACLs here: https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html");
            }
        }),
    },
    {
        name: "no-public-ingress-security-group-rules",
        description: "Prohibits setting a security group rule with global ingress.",
        enforcementLevel: "mandatory",
        validateResource: validateResourceOfType(aws.ec2.SecurityGroupRule, (sgRule, args, reportViolation) => {
            if (sgRule.type === "ingress") {
                if (sgRule.cidrBlocks) {
                    if (sgRule.cidrBlocks.includes("0.0.0.0/0")) {
                        reportViolation(
                            "You cannot set globally open ingress rules for security groups. " 
                        )
                    }
                }
            }
        }),
    },
    {
        name: "no-public-ingress-security-groups",
        description: "Prohibits setting a security group with global ingress.",
        enforcementLevel: "mandatory",
        validateResource: validateResourceOfType(aws.ec2.SecurityGroup, (sg, args, reportViolation) => {
            if (sg.ingress) {
                for (let i = 0; i < sg.ingress.length; i++) {
                    const ingressRule = sg.ingress[i]
                    if ((ingressRule) && (ingressRule.cidrBlocks)) {
                        if (ingressRule.cidrBlocks.includes("0.0.0.0/0")) {
                            reportViolation(
                                "You cannot set globally open ingress rules for security groups. " 
                            )
                        }
                    }
                }
            }
        }),
    }

],
});
