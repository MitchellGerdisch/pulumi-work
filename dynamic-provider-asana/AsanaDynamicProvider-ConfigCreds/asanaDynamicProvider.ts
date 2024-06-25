// A dynamic provider for Asana Tasks.
// See https://developers.asana.com/docs/overview
// https://developers.asana.com/reference/getuser

// REQUIRES the following stack config values:
// * asanaAccessTokena: this is the Asana workspace in which the resources are created. 
//   * It can be found by logging into Asana and then going here: https://app.asana.com/api/1.0/workspaces?opt_pretty
// * asanaWorkspaceGid: this is a PAT for Asana.
//   * See https://developers.asana.com/docs/quick-start for how to get a personal access token.

import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi";
import { CreateResult } from "@pulumi/pulumi/dynamic";
import axios from 'axios'
import { AxiosResponse, AxiosError } from 'axios'

export interface AsanaTaskArgs {
  taskName: pulumi.Input<string>;
  projectGid: pulumi.Input<string>;
}

export interface AsanaTaskProviderArgs {
  taskName: string;
  projectGid: string; 
}

const asanaApiUrl = "https://app.asana.com/api/1.0"
const tasksUrl = `${asanaApiUrl}/tasks`

const config = new pulumi.Config()
const accessToken = config.requireSecret("asanaAccessToken")
const workspaceGid = config.require("asanaWorkspaceGid") 

const AsanaTaskProvider: pulumi.dynamic.ResourceProvider = {

  //*** CREATE ***//
  async create(inputs: AsanaTaskProviderArgs): Promise<CreateResult> {
  
    // Use environment variable for authentication. 
    const headers = {
      'Authorization': `Bearer ${accessToken.get()}`,
      'accept': 'application/json'
    }
    console.log("headers", headers)

    const data = {
        "workspace": workspaceGid,
        "name": inputs.taskName,
        "projects": [inputs.projectGid]
    }

   let taskId:string = "unassigned"
   await axios.post(tasksUrl, {
        data: data
      }, {
        headers: headers
    }).then((response: AxiosResponse) => {
      taskId = response.data.data.gid
    }).catch((reason: AxiosError) => {
      console.log("ERROR: ", `${reason.status} - ${reason.response?.statusText}`)
      process.exit(10)
    }) 

    const taskOuts = {id: taskId, taskName: inputs.taskName, projectGid: inputs.projectGid}
    return { id: taskId, outs: taskOuts }
  },

  //*** DELETE ***//
  async delete(id) {
    const headers = {
      'Authorization': `Bearer ${accessToken.get()}`,
      'accept': 'application/json'
    }
    const deleteTaskUrl = `${tasksUrl}/${id}`
    await axios.delete(deleteTaskUrl, {
          headers: headers
    })
    .then((response: AxiosResponse) => {
    })
    .catch((reason: AxiosError) => {
      console.log("ERROR: ", `${reason.response?.status} - ${reason.response?.statusText}`)
      process.exit(20)
    }) 

  //   const taskOuts = {id: taskId, taskName: inputs.taskName, projectGid: inputs.projectGid}
  //   return { id: taskId, outs: taskOuts }
  }

}

export class AsanaTask extends pulumi.dynamic.Resource {

  constructor(name: string, args: AsanaTaskArgs, opts?: pulumi.CustomResourceOptions) {
    super(AsanaTaskProvider, name, args, opts);
  }
}



