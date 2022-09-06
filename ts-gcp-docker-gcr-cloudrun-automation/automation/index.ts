import { LocalProgramArgs, LocalWorkspace, Stack } from "@pulumi/pulumi/automation";
import * as upath from "upath";
import * as process from "process";

const args = process.argv.slice(2);
let destroy = false;
let stackName = "dev";
if (args.length > 0 && args[0]) {
  const param = args[0]
  if (param === "destroy") {
    destroy = true;
  } else {
    stackName = param
  }
} else {
  console.log("USAGE: npm run projects destroy|STACKNAME")
  console.log("Where STACKNAME is a stack name (e.g. dev)")
  process.exit(1)
}

const run = async () => {

  var projects = ["gcr-build-image", "cloud-run-deploy"]

  // If destroy is true, destroy the stacks in opposite order
  if (destroy) {
    projects.reverse()
  }
    
  // Orchestrate the two stacks
  for (var project of projects) {
    console.info(`Processing project: ${project}`)
    // create (or select if one already exists) the stack that uses our local program
    const stack = await LocalWorkspace.createOrSelectStack(getLocalProgramArgs(project, stackName));
    console.info("successfully initialized stack");
    // Set the stack configs
    setConfigs(stack)
    console.info("refreshing stack...");
    await stack.refresh({ onOutput: console.info });
    console.info("refresh complete");

    if (destroy) {
        console.info("destroying stack...");
        await stack.destroy({onOutput: console.info});
        console.info("stack destroy complete");
    } else {
      console.info("updating stack...");
      const upRes = await stack.up({ onOutput: console.info });
      console.log(`update summary: \n${JSON.stringify(upRes.summary.resourceChanges, null, 4)}`);
      console.log(upRes.outputs);
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
  await stack.setConfig("gcp:project", { value: "pulumi-ce-team" });
  await stack.setConfig("cloud-run-deploy:docker-config-file", { value: "/Users/mitch/.docker/config.json"});
  await stack.setConfig("cloud-run-deploy:imageStackName",{ value: "gcr-build-image"});
  console.info("config set");
}

