import { LocalProgramArgs, LocalWorkspace, Stack, StackNotFoundError, } from "@pulumi/pulumi/automation";
import * as upath from "upath";
import * as process from "process"

export const run = async () => {

  // These values could be set from, say, env variables populated by a CI/CD pipeline
  const pulumiOrg = "demo" 
  const stackName = process.env.STACK_NAME || "dev-mitch"  
  const region = "CentralUS"

  // These are the Pulumi projects to destroy
  const projects = [ "web-app", "web-base" ]
  
  // Base stack
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i]
    const projectStackPath = `${pulumiOrg}/${project}/${stackName}`

    console.log(`Running [destroy] for ${projectStackPath} ...`)

    const stackArgs: LocalProgramArgs = {
      stackName: projectStackPath,
      workDir: upath.joinSafe("..", project),
    }

    let result = "NOT RUN"
    // select/create the stack and do the up and destroy
    try {

      // create (or select if one already exists) a stack that uses our local program
      const stack = await LocalWorkspace.createOrSelectStack(stackArgs);

      // Set the required configuration values
      await stack.setConfig("azure-native:region", {value: region})

      // pulumi destroy the stack
      try { 
        const upStatus = await stack.destroy();
        result = upStatus.summary.result
        if (result != "succeeded") {
          console.log(`Stack UPDATE failed: ${JSON.stringify(upStatus)}`)
          console.log(``)
        }
      } catch (error) {
        console.log(`Stack UPDATE failed: ${JSON.stringify(error)}`)
        result = "UPDATE FAILURE"
      }

    } catch (error) {
      console.log("PULUMI ERROR ENCOUNTERED")
      console.log(JSON.stringify(error))
    } 
  }
}

run();

