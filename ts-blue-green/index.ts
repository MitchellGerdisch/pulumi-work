/*
 * Blue-Green demo.
 * Basic model is as follows:
 * - A "blue" system
 * - A "green" system
 * - One of these systems is the currently active system
 * - DNS record that points at the currently active system.
 * - Pulumi up drives an update based on some config value that indicates which system is active.
 *   - Of course, the update may also update content for the system to be made active.
 * 
 */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { Backend, BackendProperties } from "./backend"
import { Cert } from "./certificate"

import { activeSystem, baseName, zoneName  } from "./config"

// domain name used for cert and DNS record.
const systemDomainName = `${baseName}.${zoneName}`

// Create certificate
const cert = new Cert(baseName, {
  systemDomainName: systemDomainName
})

// Create the backends for blue and green.
const systems: string[] = ["blue", "green"]
let backends: { [id: string] : BackendProperties; } = {}

for (let system of systems) {
  const backend = new Backend(`${baseName}-${system}`, {
    indexDocumentFolder: system,
    indexDocumentName: "index.html",
  })
  backends[system] = backend.backendProperties
}

const activeBackend = backends[activeSystem]

const originAccess = new aws.cloudfront.OriginAccessControl(`${baseName}-oac`, {
  description: "Access control for backend bucket",
  originAccessControlOriginType: "s3",
  signingBehavior: "always",
  signingProtocol: "sigv4",
});

// Create a CloudFront distribution that points to the active S3 bucket
// Updating the distribution on a switch is rather slow - about 4 minutes to do the switch.
// So maybe I create separate distributions - one for each backend.
// Will also need to create different certs and aliases due to conflicts?
const distribution = new aws.cloudfront.Distribution(`${baseName}-distribution`, {
  origins: [{
      domainName: activeBackend.bucketDomainName,
      originId: activeBackend.bucketArn,
      originAccessControlId: originAccess.id,
  }],
  enabled: true,
  isIpv6Enabled: true,
  defaultRootObject: "index.html",
  aliases: [ systemDomainName ],
  defaultCacheBehavior: {
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      targetOriginId: activeBackend.bucketArn,
      forwardedValues: {
          queryString: false,
          cookies: {
              forward: "none",
          },
      },
      viewerProtocolPolicy: "redirect-to-https",
      minTtl: 0,
      defaultTtl: 240, // demos are better if things are ttling quickly and it needs to cache longer than the update time which is about 4 minutes
      maxTtl: 300,
  },
  priceClass: "PriceClass_100",
  customErrorResponses: [{
      errorCode: 404,
      responsePagePath: "/404.html",
      responseCode: 404,
      errorCachingMinTtl: 300,
  }],
  restrictions: {
      geoRestriction: {
          restrictionType: "none",
      }
  },
  viewerCertificate: {
      cloudfrontDefaultCertificate: true,
      acmCertificateArn: cert.certificateArn,
      sslSupportMethod: "sni-only"
  },
});

// Create an S3 Bucket Policies to allow cloudfront access to the objects.
// I'm thinking I can create both buckets' policies and may even be able to do it by constructing the distribution arn.
// But for now, it is replaced each time we switch from blue to green or vice versa.
const bucketPolicy = new aws.s3.BucketPolicy(`${baseName}-bucket-policy`, {
  bucket: activeBackend.bucketName, // reference to the active bucket created earlier
  policy: pulumi.all([activeBackend.bucketArn, distribution.arn]).apply(([bucketArn, distrbutionArn]) => JSON.stringify(
    {
      Version: "2012-10-17",
      Id: `${baseName}CloudFrontAccess`,
      Statement: [{
          Sid: "AllowCloudFrontServicePrincipal",
          Effect: "Allow",
          Principal: {
            Service: "cloudfront.amazonaws.com"
          },
          Action: "s3:GetObject",
          Resource: [
              `${bucketArn}/*` // policy refers to bucket name explicitly
          ],
          Condition: {
            "StringEquals": {
                "AWS:SourceArn": distrbutionArn
            }
          }
      }]
    })
  ),
})

// Create the DNS record to point to the active backend system.
const backendDnsName = distribution.domainName
const systemDns = new aws.route53.Record(baseName, {
  zoneId: aws.route53.getZoneOutput({ name: zoneName }).zoneId,
  name: baseName,
  type: "CNAME",
  ttl: 300,
  records: [ backendDnsName ]
})

export const systemUrl = pulumi.interpolate`https://${systemDomainName}`
