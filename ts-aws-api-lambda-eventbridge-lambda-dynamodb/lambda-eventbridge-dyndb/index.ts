import * as pulumi from "@pulumi/pulumi";

import { Backend } from "./backend";
import { Bus } from "./bus"
import { Frontend } from "./frontend"
import { Dashboard } from "./new-relic"

const config = new pulumi.Config();
const nameBase = config.get("nameBase") || "pipeline"
const appName = config.get("appName") || "custom.EventProcessor"
const apigwProject = config.require("apigwProject")
const apigwStackRef = new pulumi.StackReference(`${pulumi.getOrganization()}/${apigwProject}/${pulumi.getStack()}`)
const apiGwId = apigwStackRef.getOutput("apiGatewayId")

const backend = new Backend(nameBase)

const bus = new Bus(nameBase, {reader: backend.reader, appName: appName})

const frontend = bus.arn.apply(arn => new Frontend(nameBase, {busArn: arn, appName: appName, apiGwId: apiGwId}))

const dashboard = new Dashboard(nameBase, {appName: appName})

// The Frontend URL to hit that causes events
export const apiUrl = frontend.url

// DynamodDB console link to make it easier to demo/test.
const awsConfig = new pulumi.Config("aws");
const region = awsConfig.require("region");
export const EventsTableLink = pulumi.interpolate`https://console.aws.amazon.com/dynamodbv2/home?region=${region}#table?name=${backend.eventsTableName}`
export const EventsTableItems = pulumi.interpolate`https://${region}.console.aws.amazon.com/dynamodbv2/home?region=${region}#item-explorer?table=${backend.eventsTableName}&maximize=true`
// https://us-east-2.console.aws.amazon.com/dynamodbv2/home?region=us-east-2#item-explorer?table=pipeline-be-events-table-e89a888&maximize=true
// https://us-east-2.console.aws.amazon.com/dynamodbv2/home?region=us-east-2#item-explorer?table=pipeline-be-events-table-e89a888

// The URL for New Relic Dashboard
export const dashboardUrl = dashboard.url