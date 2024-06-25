// A dynamic provider for Pulumi Cloud ESC Environments that uses Environment Variables to pass in the credentials

// REQUIRES/SUPPORTS the following environment variables:
// * PULUMI_ACCESS_TOKEN: (required) This is a Pulumi access token with the necessary permissions to create an ESC Environment in a given Pulumi Cloud organization.
// * PULUMI_CLOUD_API_URL: (optional) This is the URL for the Pulumi Cloud API endpoint. Defaults to `https://api.pulumi.com`.

import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi";
import { CreateResult } from "@pulumi/pulumi/dynamic";
import axios from 'axios'
import { AxiosResponse, AxiosError } from 'axios'

export interface PulumiEnvironmentArgs {
  orgName: string;
  environmentName: string;
}

export interface PulumiEnvironmentProviderArgs {
  orgName: string
  environmentName: string;
}

// Use user-specified API URL if provided. Otherwise, use default Pulumi cloud URL.
const basePulumiApiUrl= process.env.PULUMI_CLOUD_API_URL || "https://api.pulumi.com"

// NOTE: When Pulumi Environments is GAed, the API path will no longer include "preview".
const basePulumiEnvApiUrl= `${basePulumiApiUrl}/api/preview/environments`

const PulumiEnvironmentProvider: pulumi.dynamic.ResourceProvider = {

  //*** CREATE ***//
  async create(inputs: PulumiEnvironmentProviderArgs): Promise<CreateResult> {
  
    // Use environment variable for authentication. 
    // This keeps the actual PULUMI_ACCESS_TOKEN value out of state and instead only the env variable reference is kept in state.
    // Therefore, if the token is changed between the create and the destroy, the destroy will use the new creds. 
    const headers = {
      'Authorization': `Bearer ${process.env.PULUMI_ACCESS_TOKEN}`,
      'accept': 'application/json'
    }

    const createEnvUrl = `${basePulumiEnvApiUrl}/${inputs.orgName}/${inputs.environmentName}`

    let envId:string = "unassigned"
    await axios.post(createEnvUrl, {},
      {
          headers: headers
      }).then((response: AxiosResponse) => {
        // Pulumi Cloud does not return a unique ID for an environment. So just use the environment name.
        envId = inputs.environmentName
      }).catch((reason: AxiosError) => {
        console.log("ERROR: ", `${reason.status} - ${reason.response?.statusText}`)
        process.exit(10)
      }) 

      const envOuts = {id: envId, envName: inputs.environmentName, orgName: inputs.orgName}
      return { id: envId, outs: envOuts }
  },

  //*** DELETE ***//
  async delete(id) {
    // Use environment variable for authentication. 
    // This keeps the actual PULUMI_ACCESS_TOKEN value out of state and instead only the env variable reference is kept in state.    
    // Therefore, if the token is changed between the create and the destroy, the destroy will use the new creds. 
    const headers = {
      'Authorization': `Bearer ${process.env.PULUMI_ACCESS_TOKEN}`,
      'accept': 'application/json'
    }
    /////// HOW TO GET THE ORGNAME FOR DELETE? IS IT MAGIC????? //////
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

    ///// DO I NEED TO RETURN SOMETHING HERE? //////
  //   const taskOuts = {id: taskId, taskName: inputs.taskName, projectGid: inputs.projectGid}
  //   return { id: taskId, outs: taskOuts }
  }

}

export class AsanaTask extends pulumi.dynamic.Resource {

  constructor(name: string, args: AsanaTaskArgs, opts?: pulumi.CustomResourceOptions) {
    super(AsanaTaskProvider, name, args, opts);
  }
}


