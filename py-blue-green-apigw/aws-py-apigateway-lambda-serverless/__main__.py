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
domain_name = f"{stack_name}.{hosted_zone}"

##################
## Lambda Function
##################

# Create a Lambda function, using code from the `./app` folder.

lambda_func = aws.lambda_.Function("mylambda",
    role=iam.lambda_role.arn,
    runtime="python3.7",
    handler="hello.handler",
    code=pulumi.AssetArchive({
        '.': pulumi.FileArchive(f"./hello_lambda_{stack_name}")
    })
)

# Request ACM certificate
ssl_cert = aws.acm.Certificate("ssl-cert",
                                domain_name=domain_name,
                                validation_method="DNS",
)

# Create DNS record to prove to ACM that we own the domain
ssl_cert_validation_dns_record = aws.route53.Record("ssl-cert-validation-dns-record",
                                                    zone_id=hosted_zone_id,
                                                    name=ssl_cert.domain_validation_options.apply(
                                                        lambda options: options[0].resource_record_name),
                                                    type=ssl_cert.domain_validation_options.apply(
                                                        lambda options: options[0].resource_record_type),
                                                    records=[ssl_cert.domain_validation_options.apply(
                                                        lambda options: options[0].resource_record_value)],
                                                    ttl=10*60)
# Wait for the certificate validation to succeed
validated_ssl_certificate = aws.acm.CertificateValidation("ssl-cert-validation",
                                                            certificate_arn=ssl_cert.arn,
                                                            validation_record_fqdns=[ssl_cert_validation_dns_record.fqdn],
)
# Configure API Gateway to be able to use domain name & certificate
api_domain_name = aws.apigatewayv2.DomainName("api-domain-name",
    domain_name=domain_name,
    domain_name_configuration={
        "certificate_arn": ssl_cert.arn,
        "endpoint_type": "REGIONAL",
        "security_policy": "TLS_1_2"
    },
    opts=pulumi.ResourceOptions(depends_on=[validated_ssl_certificate]))


# Create DNS record for this blue or green stack
dns = aws.route53.Record("api-dns",
    name=domain_name,
    type="A",
    zone_id=hosted_zone_id,
    aliases=[aws.route53.RecordAliasArgs(
        name=api_domain_name.domain_name_configuration.target_domain_name,
        zone_id=api_domain_name.domain_name_configuration.hosted_zone_id,
        evaluate_target_health=False,
    )])

#########################################################################
# Create an HTTP API and attach the lambda function to it
##    /{proxy+} - passes all requests through to the lambda function
##
#########################################################################

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

# url = http_lambda_backend.integration_uri

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

api_mapping = aws.apigatewayv2.ApiMapping("api_mapping", aws.apigatewayv2.ApiMappingArgs (
  domain_name=domain_name,
  api_id=http_endpoint.id,
  stage=http_stage.name
), opts=pulumi.ResourceOptions(depends_on=[api_domain_name]))

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

pulumi.export("api_endpoint", dns.fqdn)
pulumi.export("stage_name", http_stage.name)
pulumi.export(f"{stack_name} api gateway url", pulumi.Output.concat(http_endpoint.api_endpoint, "/", http_stage.name, "/"))
