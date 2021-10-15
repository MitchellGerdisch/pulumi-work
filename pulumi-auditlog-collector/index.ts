// This creates a simple Lambda function that gets the Pulumi audit logs and puts them into a DynamoDB indexed by timestamp.
// It also creates a periodic cloudwatch trigger to trigger the function.
// Ultimately it could also push the data to a log aggregator.

import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
const fetch = require("node-fetch");

// import * as awsx from "@pulumi/awsx";
// import axios from 'axios';

const projectName = pulumi.getProject();
const stackName = pulumi.getStack()
const nameBase = `${projectName}-${stackName}`

const awsConfig = new pulumi.Config("aws");
const region = awsConfig.require("region"); 

const config = new pulumi.Config();
const pulumiAccessToken = config.requireSecret("pulumi_access_token") 

interface AuditLogEntry {
    timestamp: string;
    sourceIP: string;
    event: string;
    description: string;
    user: object;
    reqStackAdmin: boolean
}

// Create DynamoDB table the audit log entries keyed by timestamp.
const logTable = new aws.dynamodb.Table(`${nameBase}-auditlog-table`, {
    attributes: [{
        name: "timestamp",
        type: "N",
    }],
    hashKey: "timestamp",
    readCapacity: 5,
    writeCapacity: 5,
});
// Provide a link to the AWS console view of the items in the table.
export const DynamoDbTableLink = pulumi.interpolate`https://${region}.console.aws.amazon.com/dynamodb/home?region=${region}#tables:selected=${logTable.name};tab=items`

// Helper function that stores an array of audit events into the DynamoDB table.
async function storeLogs(auditEvents: AuditLogEntry[]) {
    const client = new aws.sdk.DynamoDB.DocumentClient();
    // just grabbing the 5 most recent audit log entries to keep things manageable
    //for (let i = 0; i < auditEvents.length; i++) { 
    for (let i = 0; i < 5; i++) { 
        const event  = auditEvents[i]
        // Push the event into the table and assume success.
        const pushresult = await client.put({
            TableName: logTable.name.get(),
            Item: event
        }).promise()
    }
}

// Helper function that hits the Pulumi API to get audit logs.
// It doesn't do any pagination so it just gets the most recent 101 events.
async function getAuditLogs(org: string, accessToken: string): Promise<AuditLogEntry[]> {
    // Get the audit logs (most recent 101 of them.
    // The startTime provided is basically way in the future and so it will get all the audit logs to date.
    const auditLogUrl = `https://api.pulumi.com/api/orgs/${org}/auditlogs?startTime=999999999999999999`
    const headers =  {
        'Authorization': `token ${accessToken}`,
        'content-type': 'application/json;charset=UTF-8',
    }

    const logs = await fetch(auditLogUrl, {
        method: 'GET',
        headers: headers
    })
    const auditLogs = await logs.json();
    
    return auditLogs.auditLogEvents;
}

// Lambda function that reads Pulumi audit log and stores the data in DynamoDB
const logGrabber =  pulumiAccessToken.apply(token => {

    // The lambda function that gets and stores the logs.
    const eventRuleHandler: aws.cloudwatch.EventRuleEventHandler = async (
        event: aws.cloudwatch.EventRuleEvent,
      ) => {
        const auditEvents = await getAuditLogs("demo", token)
        await storeLogs(auditEvents)
    }

    // Uses a mixin available with the aws.cloudwatch sdk that let's you easily create a scheduled
    // cloudwatch event that runs the lambda function on a scheduled interval.
    const runLogGrabber: aws.cloudwatch.EventRuleEventSubscription = aws.cloudwatch.onSchedule(
        `${nameBase}-log-event-subscription`,
        "rate(1 minute)", // run every 1 minute
        eventRuleHandler, // run the lambda that gets and stores the logs
    );
})