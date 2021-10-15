
WORK IN PROGRESS

import * as azure from "@pulumi/azure";
import * as resources from "@pulumi/azure-nextgen/resources/latest"
import * as network from "@pulumi/azure-nextgen/network/latest"
import { PolicyPack, validateResourceOfType } from "@pulumi/policy";

new PolicyPack("azure-typescript", {
    policies: [{
        name: "resource-group-central-only",
        description: "Prohibits resource groups in regions other than us central. Go Buckeyes!",
        enforcementLevel: "mandatory",
        validateResource: validateResourceOfType(resources.ResourceGroup, (resourceGroup, args, reportViolation) => {
            if (resourceGroup.location != "centralus") {
                reportViolation(
                    `Resource Group is not in US Central region.`
                );
            }
        }),
    },
    {
        name: "sg-no-public-ingress",
        description: "Prohibits setting global ingress for a security group.",
        enforcementLevel: "mandatory",
        validateResource: validateResourceOfType(network.SecurityRule, (rule, args, reportViolation) => {
            if (rule.sourceAddressPrefix === "*") || (rule.)
            if (.containerAccessType === "blob" || container.containerAccessType === "container") {
                reportViolation(
                    "Azure Storage Container must not have blob or container access set. " +
                    "Read more about read access here: " +
                    "https://docs.microsoft.com/en-us/azure/storage/blobs/storage-manage-access-to-resources");
            }
        }),
    }
],
});
