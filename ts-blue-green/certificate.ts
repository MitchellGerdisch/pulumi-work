import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface CertArgs {
  systemDomainName: string
}
export class Cert extends pulumi.ComponentResource {
  public readonly certificateArn: pulumi.Output<string>;

  constructor(name: string, args: CertArgs, opts?: pulumi.ComponentResourceOptions) {

    super("custom:resource:Cert", name, args, opts);

    const eastRegion = new aws.Provider("east", {
      profile: aws.config.profile,
      region: "us-east-1", // Per AWS, ACM certificate must be in the us-east-1 region.
    });

    const certificateConfig: aws.acm.CertificateArgs = {
      domainName: args.systemDomainName,
      validationMethod: "DNS",
    };
    const certificate = new aws.acm.Certificate(`${name}-cert`, certificateConfig, { parent: this, provider: eastRegion });

    const domainParts = getDomainAndSubdomain(args.systemDomainName);
    const hostedZoneId = aws.route53.getZoneOutput({ name: domainParts.parentDomain }).zoneId

    /**
    *  Create a DNS record to prove that we _own_ the domain we're requesting a certificate for.
    *  See https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-validate-dns.html for more info.
    */
    const certificateValidationDomain = new aws.route53.Record(`${name}-validation`, {
      name: certificate.domainValidationOptions[0].resourceRecordName,
      zoneId: hostedZoneId,
      type: certificate.domainValidationOptions[0].resourceRecordType,
      records: [certificate.domainValidationOptions[0].resourceRecordValue],
      ttl: 300
    }, { parent: this });
    const validationRecordFqdns = [ certificateValidationDomain.fqdn ]

    /**
    * This is a _special_ resource that waits for ACM to complete validation via the DNS record
    * checking for a status of "ISSUED" on the certificate itself. No actual resources are
    * created (or updated or deleted).
    *
    * See https://www.terraform.io/docs/providers/aws/r/acm_certificate_validation.html for slightly more detail
    * and https://github.com/terraform-providers/terraform-provider-aws/blob/master/aws/resource_aws_acm_certificate_validation.go
    * for the actual implementation.
    */
    const certificateValidation = new aws.acm.CertificateValidation(`${name}-certificateValidation`, {
      certificateArn: certificate.arn,
      validationRecordFqdns: validationRecordFqdns,
    }, { parent: this, provider: eastRegion });

    this.certificateArn = certificate.arn
  }
}

// Split a domain name into its subdomain and parent domain names.
// e.g. "www.example.com" => "www", "example.com".
function getDomainAndSubdomain(domain: string): { subdomain: string, parentDomain: string } {
    const parts = domain.split(".");
    if (parts.length < 2) {
        throw new Error(`No TLD found on ${domain}`);
    }
    // No subdomain, e.g. awesome-website.com.
    if (parts.length === 2) {
        return { subdomain: "", parentDomain: domain };
    }

    const subdomain = parts[0];
    parts.shift();  // Drop first element.
    return {
        subdomain,
        // Trailing "." to canonicalize domain.
        parentDomain: parts.join(".") + ".",
    };
}