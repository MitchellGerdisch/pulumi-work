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

stackref = pulumi.StackReference(f"{pulumi.get_organization()}/{app_project_name}/{active_system_name}")
api_endpoint = stackref.get_output("api_endpoint")
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

# # Create DNS record for this blue or green stack
# dns = aws.route53.Record("api-dns",
#     name=domain_name,
#     type="A",
#     zone_id=hosted_zone_id,
#     aliases=[aws.route53.RecordAliasArgs(
#         name=api_domain_name.domain_name_configuration.target_domain_name,
#         zone_id=api_domain_name.domain_name_configuration.hosted_zone_id,
#         evaluate_target_health=False,
#     )])

# Create dns record.
# active_system_record = aws.route53.Record('active_system',
#     zone_id=hosted_zone_id,
#     name=domain_name,
#     type='CNAME',
#     records=[api_endpoint],
#     ttl=30)

active_system_record = aws.route53.Record('active_system',
    zone_id=hosted_zone_id,
    name=domain_name,
    type='A',
    aliases=[aws.route53.RecordAliasArgs(
      name=api_endpoint,
      zone_id=hosted_zone_id,
      evaluate_target_health=False,
    )])

pulumi.export("active url", pulumi.Output.concat("https://", active_system_record.fqdn,"/",stage_name))


stack_tag = pulumiservice.StackTag("stacktag", pulumiservice.StackTagArgs(
  organization=pulumi.get_organization(),
  project=pulumi.get_project(),
  stack=pulumi.get_stack(),
  name="demo",
  value="blue-green"
))