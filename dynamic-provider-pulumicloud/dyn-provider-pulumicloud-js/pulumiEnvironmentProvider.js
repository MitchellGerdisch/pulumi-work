// A dynamic provider for Pulumi Cloud ESC Environments that uses Environment Variables to pass in the credentials
// Using environment variables as such allows one to keep the actual credential value out of state.
// Although if the cred is in state, it is encypted, if the token is changed between the create and the destroy, 
// the destroy will be able to use the new cred found in the environment variable instead of using a value from state. 

// REQUIRES/SUPPORTS the following environment variables:
// * PULUMI_ACCESS_TOKEN: (required) This is a Pulumi access token with the necessary permissions to create an ESC Environment in a given Pulumi Cloud organization.
// * PULUMI_CLOUD_API_URL: (optional) This is the URL for the Pulumi Cloud API endpoint. Defaults to `https://api.pulumi.com`.

const pulumi = require("@pulumi/pulumi");
const axios = require('axios');

// Use user-specified API URL if provided. Otherwise, use default Pulumi cloud URL.
const basePulumiApiUrl= process.env.PULUMI_CLOUD_API_URL || "https://api.pulumi.com"

// NOTE: When Pulumi Environments is GAed, the API path will no longer include "preview".
const basePulumiEnvApiUrl= `${basePulumiApiUrl}/api/preview/environments`

const PulumiEnvironmentProvider = {

  //*** CREATE ***//
  async create(inputs) {
  
    // It is important to set up the headers in the action as opposed to outside of the provider so that the environment variable reference is
    // stored in state instead of the actual credential value.
    const headers = {
      'Authorization': `token ${process.env.PULUMI_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }

    const createEnvUrl = `${basePulumiEnvApiUrl}/${inputs.orgName}/${inputs.environmentName}`

    let envId = "unassigned"
    await axios.post(createEnvUrl, {},
      {
          headers: headers
      }).then((response) => {
        // Pulumi Cloud does not return a unique ID for an environment. So create one using the org and environment name.
        envId = `${inputs.orgName}/${inputs.environmentName}`
      }).catch((reason) => {
        console.log("ERROR: ", `${reason.status} - ${reason.response?.statusText}`)
        process.exit(10)
      }) 

      const envOuts = {id: envId, envName: inputs.environmentName, orgName: inputs.orgName}
      return { id: envId, outs: envOuts }
  },

  //*** DELETE ***//
  async delete(id, props) {

    // It is important to set up the headers in the action as opposed to outside of the provider so that the environment variable reference is
    // stored in state instead of the actual credential value. 
    const headers = {
      'Authorization': `token ${process.env.PULUMI_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }

    const deleteEnvUrl = `${basePulumiEnvApiUrl}/${id}`
    await axios.delete(deleteEnvUrl, {
          headers: headers
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
    super(PulumiEnvironmentProvider, name, args, opts);
  }
}

exports.PulumiEnvironment = PulumiEnvironment;




