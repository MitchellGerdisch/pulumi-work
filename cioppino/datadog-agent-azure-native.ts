import * as pulumi from "@pulumi/pulumi";
import {checkDatadogKeys, agentInstallScript}  from "../demos-common/datadog"

// Adds the Datadog agent script to instances in the stack if the Datadog keys are configured.
export function installDatadogAgent() {
  if (checkDatadogKeys()) {
    const installScript = agentInstallScript()
    const encodedInstallScript = installScript.apply(script => {
      const encScript = Buffer.from(script).toString('base64')
      return encScript
    });

    pulumi.runtime.registerStackTransformation((args) => {
      if (args.type.search("azure-native:compute:VirtualMachine") != -1) {  
        args.props["osProfile"]["customData"] = encodedInstallScript 
        return { props: args.props, opts: args.opts }
      }
      return undefined;
    });
  }
}