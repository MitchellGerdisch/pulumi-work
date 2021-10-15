// This creates a simple Pulumi web-hook compatible Lambda function for demonstration purproses.

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const projectName = pulumi.getProject();
const stackName = pulumi.getStack()
const nameBase = `${projectName}-${stackName}`

// Create DynamoDB table to store the data from the API.
const logTable = new aws.dynamodb.Table(`${nameBase}-webhook-table`, {
    attributes: [{
        name: "id",
        type: "N",
    }],
    hashKey: "id",
    readCapacity: 5,
    writeCapacity: 5,
});

// Create an API endpoint
// Exposes a POST and a GET endpoint.
// The POST endpoint can be used as Pulumi webhook URL.
// You can also optionally pass query parameters - you can use any names or values.
// This is supported in case someone wants to see it with query parameters.
// This API simply stores the payload and any query parameters in the dynamodb table.
// The GET endpoint can be used in a browser to get a dump of the data the webhook pushed out.
const endpoint = new awsx.apigateway.API(`${nameBase}-webhook-endpoint`, {
    routes: [
    {
        path: "/pushdata",  // ?whatever=whatever&something=something
        method: "POST",
        eventHandler: async (event) => {
            const client = new aws.sdk.DynamoDB.DocumentClient();
            let params = event.queryStringParameters || {}; // params
            let body = event.body || ""; // Body is base64 encoded
            let decodedBody:string = Buffer.from(body, 'base64').toString('ascii') // decode from base64 to string json
            let jsonBody = JSON.parse(decodedBody); // convert from string formatted json to a json object that can be referenced.

            // Get current table size and calculate the next index
            // This is not a perfect approach since if someone deletes a table entry other than the last one we get stuck.
            // But it's sufficient for this use-case.
            const tableScan = await client.scan({
                TableName: logTable.name.get(),
                Select: "COUNT"
            }).promise();
            let nextItemNumber = (tableScan.Count ? tableScan.Count + 1 : 1)

            // Push the next item into the table and assume success.
            await client.put({
                TableName: logTable.name.get(),
                Item: {id: nextItemNumber, parameters: params, body: jsonBody} 
            }).promise()
            return {
                statusCode: 200,
                body: decodedBody,
            }
        }
    },
    {
        path: "/showdata",  // ?whatever=whatever&something=something
        method: "GET",
        eventHandler: async (event) => {
            const client = new aws.sdk.DynamoDB.DocumentClient();

            // Get current contents and return the data.
            const tableDump= await client.scan({
                TableName: logTable.name.get(),
                Select: "ALL_ATTRIBUTES"
            }).promise();
            return {
                statusCode: 200,
                body: JSON.stringify(tableDump, null, 4),
            }
        }
    }]

});

exports.WebHookURL = pulumi.interpolate`${endpoint.url}pushdata`;
exports.DumpLogDataURL = pulumi.interpolate`${endpoint.url}showdata`
exports.BackendTable = logTable.name