// Stand up existing resources for the use-case described in the README.

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const nameBase = "mitch-existing"

// Set up an API Gateway
const apiGwName = `${nameBase}-apigw`
const apigw = new aws.apigatewayv2.Api(apiGwName, {
  name: apiGwName,
  protocolType: "HTTP",
});

export const apiGatewayId = apigw.id
export const apiGatewayName = apigw.name
