import * as gcp from "@pulumi/gcp";
import { PolicyPack, validateResourceOfType } from "@pulumi/policy";

new PolicyPack("gcp-cloudrun-function-access", {
    policies: [{
        name: "cloudrun-restrict-members",
        description: "Flags use of \"allusers\" for IAM policy.",
        enforcementLevel: "advisory",
        // validateResource: validateResourceOfType(gcp.storage.BucketACL, (acl, args, reportViolation) => {
        validateResource: validateResourceOfType(gcp.cloudrun.IamMember, (iammember, args, reportViolation) => {
            if (iammember.member === "allUsers") {
                reportViolation("Cloudrun IAM Member set to \"allUsers\".");
            }
        }),
    }],
});
