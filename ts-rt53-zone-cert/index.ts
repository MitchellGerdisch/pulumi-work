// Route53 API Gateway Record Example
//
// Creates an API gateway
// Creates a Route53 record for the API gateway.
//
// Config Settings Needed
// - aws:zone => set to the zone name you are using.
// - project:namebase => set to a string that will be used for the naming convention of resources

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const config = new pulumi.Config();
const zoneName = config.require("zone")
const nameBase = config.require("namebase")

// This is the domain alias to front the API gateway
export const dnsAlias = `${nameBase}.${zoneName}`

// Use provided zone name to find the Route53 zone and related ID
// Could create one if so inclined.
const zone = aws.route53.getZone({
    name: zoneName
});
const zoneId = zone.then(zone => zone.zoneId)

// Create the API gateway.
// Define a new GET endpoint that just returns a 200 and "hello" in the body.
const api = new awsx.apigateway.API(`${nameBase}-gw`, {
    routes: [{
        path: "/",
        method: "GET",
        eventHandler: async (event) => {
            // This code runs in an AWS Lambda anytime `/` is hit.
            return {
                statusCode: 200,
                body: "Hello! Try coming to this site via: https://"+dnsAlias,
            };
        },
    }],
})
export const apigatewayUrl =  api.url

// create certificate to be used for the custom domain name
const sslCert = new aws.acm.Certificate(`${nameBase}-sslCert`, {
    domainName: dnsAlias,
    validationMethod: "DNS",
})

// Create the necessary DNS records for ACM to validate ownership, and wait for it.
// This is done to validate the cert and is NOT setting up the record to direct traffic to the API gateway
const sslCertValidationRecord = new aws.route53.Record(`${nameBase}-sslCertValidationRecord`, {
    zoneId: zoneId,
    name: sslCert.domainValidationOptions[0].resourceRecordName,
    type: sslCert.domainValidationOptions[0].resourceRecordType,
    records: [ sslCert.domainValidationOptions[0].resourceRecordValue ],
    ttl: 10 * 60 /* 10 minutes */,
});
const sslCertValidationIssued = new aws.acm.CertificateValidation(`${nameBase}-sslCertValidationIssued`, {
    certificateArn: sslCert.arn,
    validationRecordFqdns: [ sslCertValidationRecord.fqdn ],
});

// Configure an edge-optimized domain for our API Gateway. This will configure a Cloudfront CDN
// distribution behind the scenes and serve our API Gateway at a custom domain name over SSL.
const webDomain = new aws.apigateway.DomainName(`${nameBase}-webCdn`, {
    certificateArn: sslCertValidationIssued.certificateArn,
    domainName: dnsAlias
});
const webDomainMapping = new aws.apigateway.BasePathMapping(`${nameBase}-webDomainMapping`, {
    restApi: api.restAPI,
    stageName: api.stage.stageName,
    domainName: webDomain.id,
});

// Finally create an alias A record for our domain that directs to our custom domain.
const webDnsRecord = new aws.route53.Record(`${nameBase}-webDnsRecord`, {
    name: dnsAlias,
    type: "A",
    zoneId: zoneId,
    aliases: [{
        evaluateTargetHealth: true,
        name: webDomain.cloudfrontDomainName,
        zoneId: webDomain.cloudfrontZoneId,
    }],
}); //, { dependsOn: sslCertValidationIssued });

