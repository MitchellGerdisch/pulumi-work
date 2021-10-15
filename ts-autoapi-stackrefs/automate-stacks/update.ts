import { LocalProgramArgs, LocalWorkspace, Stack, StackNotFoundError, } from "@pulumi/pulumi/automation";
import * as upath from "upath";
import * as process from "process"

export const run = async () => {
  // These values could be set from, say, env variables populated by a CI/CD pipeline
  const pulumiOrg = process.env.PULUMI_ORG || "demo" 
  const stackName = process.env.STACK_NAME || "dev"
  const location = process.env.LOCATION || "CentralUS"

  // These are the Pulumi projects to deploy.
  const baseProject = "web-base"
  const projects = [ "web-base", "web-app" ]
  
  // Base stack
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i]
    const projectStackPath = `${pulumiOrg}/${project}/${stackName}`
    const baseStackPath = `${pulumiOrg}/${baseProject}/${stackName}`

    console.log(`  Running [update] for ${projectStackPath} ...`)

    const stackArgs: LocalProgramArgs = {
      stackName: projectStackPath,
      workDir: upath.joinSafe("..", project),
    }

    let upResult = "NOT RUN"
    try {
      // create (or select if one already exists) a stack that uses our local program
      const stack = await LocalWorkspace.createOrSelectStack(stackArgs);

      // Set the required configuration values
      await stack.setConfig("azure-native:location", {value: location})
      await stack.setConfig("baseStackName", {value: baseStackPath})

      // pulumi up the stack
      try { 
        const upStatus = await stack.up();
        upResult = upStatus.summary.result
        if (upResult != "succeeded") {
          console.log(`Stack UPDATE failed: ${JSON.stringify(upStatus)}`)
          console.log(``)
        }
      } catch (error) {
        console.log(`Stack UPDATE failed: ${JSON.stringify(error)}`)
        upResult = "UPDATE FAILURE"
      }

    } catch (error) {
      console.log("PULUMI ERROR ENCOUNTERED")
      console.log(JSON.stringify(error))
    } 
  }
}

run();

