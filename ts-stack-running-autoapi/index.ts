import * as pulumi from "@pulumi/pulumi";
import {local } from "@pulumi/command";


// Some fun running automation API from a Pulumi stack.
// Possible usecases:
//  - Use deployments to run automation API
//    - Create a simple github action cronjob (or other cron runner) that then just calls the deployments API to run the automation API code
//      And the autoapi code does stuff like clean up stacks, etc.

const fakeEnvVar = new Date().getTime();
const runAuto = new local.Command("runAuto", {
  create: "npx ts-node ./autoapi.ts",
  delete: "npx ts-node ./autoapi.ts destroy",
  environment: {
    FAKE_ENV_VAR: String(fakeEnvVar)
  },
  triggers: [ "environment" ], // cause create to run each time the stack is run
})




