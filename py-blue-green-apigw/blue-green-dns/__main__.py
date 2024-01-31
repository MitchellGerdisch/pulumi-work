"""An AWS Python Pulumi program"""

import pulumi
import pulumi_pulumiservice as pulumiservice
from pulumi_aws import route53

import pulumi
import pulumi_aws as aws

config = pulumi.Config()
hosted_zone = config.get("hosted_zone") or "pulumi-ce.team"
hosted_zone_id = aws.route53.get_zone(name=hosted_zone).id
app_project_name = config.get("app_project_name") or "aws-py-apigateway-lambda-serverless"

active_system_name = config.require("active_system_name")

# Get values from the stack that is now considered the active environment.
stackref = pulumi.StackReference(f"{pulumi.get_organization()}/{app_project_name}/{active_system_name}")
api_id = stackref.get_output("api_id")
stage_name = stackref.get_output("stage_name")

domain_name = f"hello.{hosted_zone}"

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

# Configure "active" API Gateway to be able to use domain name & certificate
api_domain_name = aws.apigatewayv2.DomainName("api-domain-name",
    domain_name=domain_name,
    domain_name_configuration={
        "certificate_arn": ssl_cert.arn,
        "endpoint_type": "REGIONAL",
        "security_policy": "TLS_1_2"
    },
    opts=pulumi.ResourceOptions(depends_on=[validated_ssl_certificate]))

# Create active DNS record
active_system_record = aws.route53.Record('active_system',
    zone_id=hosted_zone_id,
    name=domain_name,
    type='A',
    aliases=[aws.route53.RecordAliasArgs(
      name=api_domain_name.domain_name_configuration.target_domain_name,
      zone_id=api_domain_name.domain_name_configuration.hosted_zone_id,
      evaluate_target_health=False,
    )])

# Create mapping of domain name to active api gw
api_mapping = aws.apigatewayv2.ApiMapping("api_mapping", aws.apigatewayv2.ApiMappingArgs (
  domain_name=domain_name,
  api_id=api_id,
  stage=stage_name,
), opts=pulumi.ResourceOptions(depends_on=[api_domain_name], delete_before_replace=True))


pulumi.export("active url", pulumi.Output.concat("https://", active_system_record.fqdn,"/",stage_name))


stack_tag = pulumiservice.StackTag("stacktag", pulumiservice.StackTagArgs(
  organization=pulumi.get_organization(),
  project=pulumi.get_project(),
  stack=pulumi.get_stack(),
  name="demo",
  value="blue-green"
))