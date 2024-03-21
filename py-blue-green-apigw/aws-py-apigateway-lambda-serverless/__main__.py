"""An AWS Python Pulumi program"""

import iam
import pulumi
import pulumi_aws as aws
import pulumi_pulumiservice as pulumiservice

region = aws.config.region

stack_name = pulumi.get_stack()

config = pulumi.Config()
hosted_zone = config.get("hosted_zone") or "pulumi-ce.team"
hosted_zone_id = aws.route53.get_zone(name=hosted_zone).id
custom_stage_name = config.get("stage_name") or "my-app"

##################
## Lambda Function
##################

# Create a Lambda function, using code from the hello_lambda_X folder.
lambda_func = aws.lambda_.Function("mylambda",
    role=iam.lambda_role.arn,
    runtime="python3.7",
    handler="hello.handler",
    code=pulumi.AssetArchive({
        '.': pulumi.FileArchive(f"./hello_lambda_{stack_name}")
    })
)

# Create an HTTP API and attach the lambda function to it
http_endpoint = aws.apigatewayv2.Api("http-api-pulumi-example",
    protocol_type="HTTP",
)

http_lambda_backend = aws.apigatewayv2.Integration("example",
    api_id=http_endpoint.id,
    integration_type="AWS_PROXY",
    connection_type="INTERNET",
    description="Lambda example",
    integration_method="POST",
    integration_uri=lambda_func.arn,
    passthrough_behavior="WHEN_NO_MATCH"
)

http_route = aws.apigatewayv2.Route("example-route",
    api_id=http_endpoint.id,
    route_key="ANY /{proxy+}",
    target=http_lambda_backend.id.apply(lambda targetUrl: "integrations/" + targetUrl)
)

http_stage = aws.apigatewayv2.Stage("example-stage",
    api_id=http_endpoint.id,
    name=custom_stage_name,
    route_settings= [
        {
            "route_key": http_route.route_key,
            "throttling_burst_limit": 1,
            "throttling_rate_limit": 0.5,
        }
    ],
    auto_deploy=True
)

# Give permissions from API Gateway to invoke the Lambda
http_invoke_permission = aws.lambda_.Permission("api-http-lambda-permission",
    action="lambda:invokeFunction",
    function=lambda_func.name,
    principal="apigateway.amazonaws.com",
    source_arn=http_endpoint.execution_arn.apply(lambda arn: arn + "*/*"),
)

stack_tag = pulumiservice.StackTag("stacktag", pulumiservice.StackTagArgs(
  organization=pulumi.get_organization(),
  project=pulumi.get_project(),
  stack=pulumi.get_stack(),
  name="demo",
  value="blue-green"
))

pulumi.export("api_id", http_endpoint.id)
pulumi.export("stage_name", http_stage.name)
pulumi.export(f"{stack_name} api gateway url", pulumi.Output.concat(http_endpoint.api_endpoint, "/", http_stage.name, "/"))
