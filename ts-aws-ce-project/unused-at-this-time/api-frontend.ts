import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const existingApiGwName = config.require("existingApiGwName")
const existingApiGwId = config.require("existingApiGwId")
const stack = pulumi.getStack();

interface FrontendArgs {
  busArn: Input<string>;
};

export class Frontend extends pulumi.ComponentResource {
  public readonly url: Output<string>;

  constructor(name: string, args: FrontendArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:EventProcessor:Frontend", name, args, opts);

    const nameBase = `${name}-fe`
    const busArn = args.busArn
    const eventSource = args.appName
    const frontEndRoute = `/${eventSource}`

    // Set up an API Gateway
    const apigw = new aws.apigatewayv2.Api(`${nameBase}-apiGwName`, {
      protocolType: "HTTP",
    });

    // Build frontend lambda which receives requests from the API GW
    const lambdaRole = new aws.iam.Role(`${nameBase}-lambdarole`, {
      assumeRolePolicy: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
            Effect: "Allow",
            Sid: "",
          },
        ],
      },
    }, {parent:this});

    // Attach policies to the Lambda role created above
    const lambdaRoleAttachmentLambdaExecution = new aws.iam.RolePolicyAttachment(`${nameBase}-PolicyLambdaExecution`, {
      role: lambdaRole,
      policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
    }, {parent:this});
    const lambdaRoleAttachmentEventBus = new aws.iam.RolePolicyAttachment(`${nameBase}-PolicyEventBus`, {
      role: lambdaRole,
      policyArn: "arn:aws:iam::aws:policy/AmazonEventBridgeFullAccess"
    }, {parent:this});

    // Create the Lambda to execute
    const lambda = new aws.lambda.Function(`${nameBase}-lambda`, {
      code: new pulumi.asset.AssetArchive({
        "infra_info.js": new pulumi.asset.StringAsset(`module.exports.infraInfo=
          {
            eventBusName: "${busArn}",
            eventSource: "${eventSource}"
          }
        `),
        ".": new pulumi.asset.FileArchive("./fe-lambda-app"),
      }),
      runtime: "nodejs12.x",
      role: lambdaRole.arn,
      handler: "index.handler",
    }, {parent:this});

    // Give API Gateway permissions to invoke the Lambda
    const lambdaPermission = new aws.lambda.Permission(`${nameBase}-lambdaPermission`, {
      action: "lambda:InvokeFunction",
      principal: "apigateway.amazonaws.com",
      function: lambda,
      sourceArn: pulumi.interpolate`${apiGw.executionArn}/*/*`,
    }, {parent:this});

    const lambdaIntegration = new aws.apigatewayv2.Integration(`${nameBase}-lambdaIntegration`, {
      apiId: apiGw.id,
      integrationType: "AWS_PROXY",
      integrationUri: lambda.arn,
      integrationMethod: "POST",
      payloadFormatVersion: "2.0",
      passthroughBehavior: "WHEN_NO_MATCH",
    }, {parent:this});

    const lambdaRoute = new aws.apigatewayv2.Route(`${nameBase}-lambdaRoute`, {
      apiId: apiGw.id,
      routeKey: `GET ${frontEndRoute}`,
      target: pulumi.interpolate`integrations/${lambdaIntegration.id}`,
    }, {parent:this});

    const stage = new aws.apigatewayv2.Stage(`${nameBase}-apiStage`, {
      apiId: apiGw.id,
      name: stack,
      routeSettings: [
        {
          routeKey: lambdaRoute.routeKey,
          throttlingBurstLimit: 5000,
          throttlingRateLimit: 10000,
        },
      ],
      autoDeploy: true,
    }, {parent:this});

    this.url = pulumi.interpolate`${stage.invokeUrl}/${eventSource}`
    this.registerOutputs()
  }
}