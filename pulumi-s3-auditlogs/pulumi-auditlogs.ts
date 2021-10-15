// Implements a basic, simple dynamic provider for managing Pulumi service capability to dump audit logs into S3
// See: https://www.pulumi.com/docs/intro/console/audit-logs/#automated-export 
//

import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi";
import { CreateResult, UpdateResult } from "@pulumi/pulumi/dynamic";
import axios from 'axios';

export interface PulumiAuditLogsArgs {
  pulumiApiKey: Input<string>;
  pulumiServiceEndpoint?: Input<string>;
  orgName: Input<string>;
  bucketName: Input<string>;
  prefixName: Input<string>;
  iamRoleArn: Input<string>;
}

export interface PulumiAuditLogsProviderArgs {
  pulumiApiKey: string;
  pulumiServiceEndpoint?: string;
  orgName: string;
  bucketName: string;
  prefixName: string;
  iamRoleArn: string;
}

const pulumiSaasApiUrl = "https://api.pulumi.com"

const pulumiAuditLogsProvider: pulumi.dynamic.ResourceProvider = {

  async create(inputs: PulumiAuditLogsProviderArgs): Promise<CreateResult> {
    const orgName = inputs.orgName
    const bucketName = inputs.bucketName
    const prefixName = inputs.prefixName
    const iamRoleArn = inputs.iamRoleArn
    const pulumiApiKey = inputs.pulumiApiKey

    var pulumiServiceEndpoint = "https://api.pulumi.com"
    if (inputs.pulumiServiceEndpoint) {
      pulumiServiceEndpoint = inputs.pulumiServiceEndpoint
    }
    const apiUrl  = `${pulumiServiceEndpoint}/api/orgs/${orgName}/auditlogs/export/config`

    const headers =  {
        'Authorization': `token ${pulumiApiKey}`,
        'content-type': 'application/json;charset=UTF-8',
    }

    const data = {
      newEnabled:true,
      newS3Configuration: {
        s3BucketName: bucketName,
        s3PathPrefix: prefixName,
        iamRoleArn: iamRoleArn 
      }}
    const createResults = await axios.post(apiUrl, data,
    {
        headers: headers
    })
    return { id: `AuditLogExport-${orgName}`, outs: inputs};
  },

  async update(id: string, currentOutputs: PulumiAuditLogsProviderArgs, newInputs: PulumiAuditLogsProviderArgs): Promise<UpdateResult> {
    const orgName = newInputs.orgName
    const bucketName = newInputs.bucketName
    const prefixName = newInputs.prefixName
    const iamRoleArn = newInputs.iamRoleArn
    const pulumiApiKey = newInputs.pulumiApiKey

    var pulumiServiceEndpoint = "https://api.pulumi.com"
    if (newInputs.pulumiServiceEndpoint) {
      pulumiServiceEndpoint = newInputs.pulumiServiceEndpoint
    }
    const apiUrl  = `${pulumiServiceEndpoint}/api/orgs/${orgName}/auditlogs/export/config`

    const headers =  {
        'Authorization': `token ${pulumiApiKey}`,
        'content-type': 'application/json;charset=UTF-8',
    }

    const data = {
      newEnabled:true,
      newS3Configuration: {
        s3BucketName: bucketName,
        s3PathPrefix: prefixName,
        iamRoleArn: iamRoleArn 
      }}
    const createResults = await axios.post(apiUrl, data,
    {
        headers: headers
    })
    return { outs: newInputs};
  },

  // There is currently no DELETE API call to clear the export settings.
  // This is being worked on and once available this code will be updated.
  async delete(id: string, props: PulumiAuditLogsProviderArgs): Promise<void> {
    const orgName = props.orgName
    const bucketName = props.bucketName
    const prefixName = props.prefixName
    const iamRoleArn = props.iamRoleArn
    const pulumiApiKey = props.pulumiApiKey

    var pulumiServiceEndpoint = "https://api.pulumi.com"
    if (props.pulumiServiceEndpoint) {
      pulumiServiceEndpoint = props.pulumiServiceEndpoint
    }

    // const apiUrl  = `${pulumiServiceEndpoint}/api/orgs/${orgName}/auditlogs/export/config`

    // const headers =  {
    //     'Authorization': `token ${pulumiApiKey}`,
    //     'content-type': 'application/json;charset=UTF-8',
    // }

    // const data = {
    //   newEnabled:true,
    //   newS3Configuration: {
    //     s3BucketName: "",
    //     s3PathPrefix: "",
    //     iamRoleArn: "",
    //   }}
    // const createResults = await axios.post(apiUrl, data,
    // {
    //     headers: headers
    // })
  },

  async diff(id: string, previousOutput: PulumiAuditLogsProviderArgs, news: PulumiAuditLogsProviderArgs): Promise<pulumi.dynamic.DiffResult> {
    const replaces: string[] = [];
    let changes = false;
    let deleteBeforeReplace = false;

    // If the org name changes, which would be kind of weird, it means we need to delete the config on the old
    // org and create a new config on the new org.
    if (previousOutput.orgName !== news.orgName) {
      changes = true
      deleteBeforeReplace = true
      replaces.push("orgName")
    }

    // If any of the other items changes, then we just need a simple update.
    if ((previousOutput.bucketName !== news.bucketName) || (previousOutput.prefixName != news.prefixName) || (previousOutput.iamRoleArn != news.iamRoleArn)) {
        changes = true
    }

    return {
        deleteBeforeReplace: deleteBeforeReplace,
        replaces: replaces,
        changes: changes,
    };
  },

  async check(olds: PulumiAuditLogsProviderArgs, news: PulumiAuditLogsProviderArgs): Promise<pulumi.dynamic.CheckResult> {
    const failures: pulumi.dynamic.CheckFailure[] = [];

    // Check the access token is of valid format
    const pulumiAccessTokenPattern = /^pul-[a-z0-9]+$/
    if (!news.pulumiApiKey.match(pulumiAccessTokenPattern)) {
      failures.push({
        property: "pulumiApiKey",
        reason: "\npulumiApiKey must be a valid Pulumi Access token of form \"pul-xxxxxxxxx\".",
      }); 
    }

    if (failures.length > 0) {
      return { failures: failures };
    } 

    return {inputs: news}
  },




  // Need to add update operation
}

export class PulumiAuditLogs extends pulumi.dynamic.Resource {
    constructor(name: string, args: PulumiAuditLogsArgs, opts?: pulumi.CustomResourceOptions) {
        super(pulumiAuditLogsProvider, name, args, opts);
    }
}