// A dynamic provider for Pulumi Cloud ESC Environments that uses Environment Variables or Pulumi config to pass in the credentials

const pulumi = require("@pulumi/pulumi");
const axios = require('axios');

// Use user-specified API URL if provided. Otherwise, use default Pulumi cloud URL.
const basePulumiApiUrl= process.env.PULUMI_CLOUD_API_URL || "https://api.pulumi.com"

// NOTE: When Pulumi Environments is GAed, the API path will no longer include "preview".
const basePulumiEnvApiUrl= `${basePulumiApiUrl}/api/preview/environments`

class PulumiEnvironmentProvider {

    //*** CONFIG ***//
    async configure(req) {

      let accessToken = process.env.PULUMI_ACCESS_TOKEN || ""
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
  async create(inputs) {
  
    const createEnvUrl = `${this.basePulumiEnvApiUrl}/${inputs.orgName}/${inputs.environmentName}`

    let envId = "unassigned"
    await axios.post(createEnvUrl, {},
      {
          headers: this.headers
      }).then((response) => {
        // Pulumi Cloud does not return a unique ID for an environment. So create one using the org and environment name.
        envId = `${inputs.orgName}/${inputs.environmentName}`
      }).catch((reason) => {
        console.log("ERROR: ", `${reason.status} - ${reason.response?.statusText}`)
        process.exit(10)
      }) 

      const envOuts = {id: envId, envName: inputs.environmentName, orgName: inputs.orgName}
      return { id: envId, outs: envOuts }
  }

  //*** DELETE ***//
  async delete(id, props) {

    const deleteEnvUrl = `${this.basePulumiEnvApiUrl}/${id}`
    await axios.delete(deleteEnvUrl, {
          headers: this.headers
    })
    .then((response) => {
    })
    .catch((reason) => {
      console.log("ERROR: ", `${reason.response?.status} - ${reason.response?.statusText}`)
      process.exit(20)
    }) 
  }
}

class PulumiEnvironment extends pulumi.dynamic.Resource {

  constructor(name, args, opts) {
    super(new PulumiEnvironmentProvider, name, args, opts);
  }
}

exports.PulumiEnvironment = PulumiEnvironment;




