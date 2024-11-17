// A dynamic provider for Pulumi Cloud ESC Environments that uses Environment Variable or Pulumi Config for authentication.

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

class PulumiEnvironmentProvider implements pulumi.dynamic.ResourceProvider {
  private headers: object = {}; 
  private basePulumiEnvApiUrl: string = "";

  //*** CONFIG ***//
  async configure(req: pulumi.dynamic.ConfigureRequest): Promise<void> {

    let accessToken:string = process.env.PULUMI_ACCESS_TOKEN || ""
    if (accessToken) {
      console.log("Using environment variable to get the access token")
    } else {
      // Use config to get the access token
      console.log("Using Pulumi config to get the access token")
      accessToken = req.config.require("pulumiAccessToken")
    }

    this.headers = {
      'Authorization': `token ${accessToken}`,
      'Content-Type': 'application/json'
    }

    // API endpoint for interacting with Pulumi Cloud Environments
    const basePulumiApiUrl= process.env.PULUMI_CLOUD_API_URL || "https://api.pulumi.com"
    this.basePulumiEnvApiUrl= `${basePulumiApiUrl}/api/preview/environments`
  }

  //*** CREATE ***//
  async create(inputs: PulumiEnvironmentProviderArgs): Promise<CreateResult> {
  
    const createEnvUrl = `${this.basePulumiEnvApiUrl}/${inputs.orgName}/${inputs.environmentName}`

    let envId:string = "unassigned"
    await axios.post(createEnvUrl, {},
      {
          headers: this.headers
      }).then((response: AxiosResponse) => {
        // Pulumi Cloud does not return a unique ID for an environment. So create one using the org and environment name.
        envId = `${inputs.orgName}/${inputs.environmentName}`
      }).catch((reason: AxiosError) => {
        console.log("ERROR: ", `${reason.status} - ${reason.response?.statusText}`)
        process.exit(10)
      }) 

      const envOuts = {id: envId, envName: inputs.environmentName, orgName: inputs.orgName}
      return { id: envId, outs: envOuts }
  }

  //*** DELETE ***//
  async delete(id:string) {

    const deleteEnvUrl = `${this.basePulumiEnvApiUrl}/${id}`
    await axios.delete(deleteEnvUrl, {
          headers: this.headers
    })
    .then((response: AxiosResponse) => {
    })
    .catch((reason: AxiosError) => {
      console.log("ERROR: ", `${reason.response?.status} - ${reason.response?.statusText}`)
      process.exit(20)
    }) 
  }

}

export class PulumiEnvironment extends pulumi.dynamic.Resource {

  constructor(name: string, args: PulumiEnvironmentArgs, opts?: pulumi.CustomResourceOptions) {
    super(new PulumiEnvironmentProvider, name, args, opts);
  }
}


