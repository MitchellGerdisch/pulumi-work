import { LocalProgramArgs, LocalWorkspace, Stack } from "@pulumi/pulumi/automation";
import * as upath from "upath";
import * as process from "process";

const args = process.argv.slice(2);
let destroy = false;
let stackName = "dev";
if (args.length > 0) {
  stackName = args[0]
  if (args[1]) {
    destroy = (args[1] === "destroy")
  }
} else {
  console.log("USAGE: npm run projects STACKNAME [destroy]")
  console.log("Where STACKNAME is a stack name (e.g. dev)")
  process.exit(1)
}

const run = async () => {

  var projects = [{
    projectName: "gcr-build-image", 
    projectOutputNames: ["gcrImageDigest"]
  }, {
    projectName: "cloud-run-deploy",
    projectOutputNames: ["serviceUrl", "functionUrl"]
  }]

  // If destroy is true, destroy the stacks in opposite order
  if (destroy) {
    projects.reverse()
  }
    
  // Orchestrate the two stacks
  for (var project of projects) {
    // create (or select if one already exists) the stack that uses our local program
    const stackInfo = getLocalProgramArgs(project.projectName, stackName);
    const stack = await LocalWorkspace.createOrSelectStack(stackInfo);
    console.info(`Processing stack: ${stackInfo.stackName}`)
    console.info("successfully initialized stack");
    // Set the stack configs
    setConfigs(stack)

    if (destroy) {
        console.info("destroying stack...");
        await stack.destroy({onOutput: console.info});
        console.info("stack destroy complete");
    } else {
      console.info("updating stack...");
      const upRes = await stack.up({ onOutput: console.info });
      console.log(`update summary: \n${JSON.stringify(upRes.summary.resourceChanges, null, 4)}`);
      for (var output of project.projectOutputNames) {
        console.log(`*** Stack Output, ${output}: ${upRes.outputs[output].value}`);
      }
    }
  }
};

run();

export function getLocalProgramArgs(projectName: string, stackName: string): LocalProgramArgs {
  const programArgs: LocalProgramArgs = {
      stackName: `demo/${projectName}/${stackName}`,
      workDir: upath.joinSafe(__dirname, "..", projectName),
  };
  return programArgs
}

export async function setConfigs(stack: Stack) {
  console.info("setting up config");
  await stack.setConfig("gcp:region", { value: "us-central1" });
  await stack.setConfig("gcp:project", { value: "pulumi-ce-team" });
  await stack.setConfig("google-native:project", { value: "pulumi-ce-team" });
  await stack.setConfig("google-native:region", { value: "us-central1" });
  await stack.setConfig("cloud-run-deploy:docker-config-file", { value: "/Users/mitch/.docker/config.json"});
  await stack.setConfig("cloud-run-deploy:imageStackName",{ value: "gcr-build-image"});
  console.info("config set");
}

