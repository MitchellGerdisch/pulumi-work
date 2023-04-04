import * as gcp from "@pulumi/gcp";
import { PolicyPack, validateResourceOfType } from "@pulumi/policy";

new PolicyPack("frontend-component", {
    enforcementLevel: "mandatory",
    policies: [
        {
            name: "invoker-role",
            description: "Makes sure invoker-role is set correctly.",
            enforcementLevel: "mandatory",
            configSchema: {
                properties: {
                    frontendComponentName: {
                        type: "string",
                        default: "custom:EventProcessor:Frontend"
                    },
                    requiredRole: {
                        type: "string",
                        default: "roles/cloudfunctions.invoker"
                    }
                },
            },
            validateResource: validateResourceOfType(gcp.cloudfunctions.FunctionIamMember, (invoker, args, reportViolation) => {
                const { frontendComponentName, requiredRole } = args.getConfig<{ frontendComponentName: string, requiredRole: string }>();
                if (args.urn.match(frontendComponentName)) {
                    if (invoker.role != requiredRole ) { 
                        reportViolation("Invoker must have role: "+requiredRole);
                    }
                }
            }),
        },
        {
            name: "frontend-function-runtime",
            description: "Makes sure front-end function runtime is correct.",
            enforcementLevel: "advisory",
            configSchema: {
                properties: {
                    frontendComponentName: {
                        type: "string",
                        default: "custom:EventProcessor:Frontend"
                    },
                    requiredRuntime: {
                        type: "string",
                        default: "python38"
                    },
                },
            },
            validateResource: validateResourceOfType(gcp.cloudfunctions.Function, (frontendFn, args, reportViolation) => {
                const { frontendComponentName, requiredRuntime } = args.getConfig<{ frontendComponentName: string, requiredRuntime: string }>();
                if (args.urn.match(frontendComponentName)) {
                    if (frontendFn.runtime != requiredRuntime) { 
                        reportViolation("Function must use runtime: "+requiredRuntime);
                    }
                }
            }),
        },
    ],
});
