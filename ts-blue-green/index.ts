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

import { activeSystem, baseName, variant, zoneId, zoneName  } from "./config"

// domain name used for cert and DNS record and distribution alias.
const baseDomainName = `${baseName}.${zoneName}`
const primaryDomainName = `www.${baseDomainName}`
const secondaryDomainName = `*.${baseDomainName}` // unused if not variant 1

// Create certificate for wildcard if using two distributions (i.e. not variant 1).
const cert = new Cert(baseName, {
  baseDomainName: (variant == 1)? primaryDomainName : secondaryDomainName,
  zoneId: zoneId,
})

// Create the backends for blue and green.
let systems: string[] = ["blue", "green"]
let backends: { [id: string] : BackendProperties; } = {}

for (let system of systems) {
  const backend = new Backend(`${baseName}-${system}`, {
    indexDocumentFolder: system,
    indexDocumentName: "index.html",
  })
  backends[system] = backend.backendProperties
}

// Origin access setting used for the distribution(s).
const originAccess = new aws.cloudfront.OriginAccessControl(`${baseName}-oac`, {
  description: "Access control for backend bucket",
  originAccessControlOriginType: "s3",
  signingBehavior: "always",
  signingProtocol: "sigv4",
});

// The choice of variant (see README) drives whether one or two cloudfront distributions are created.
// In a single cloudfront variant, then distribution1 is updated to point at the active backend.
// In a dual cloudfront variant, then distribution1 points at the blue backend and distribution2 points at the green backend,
// and DNS points to cloudfront for the active system.
var dist1backendSystem = activeSystem // will switch based on activeSystem config
var dist2backendSystem = "green" // unused if variant 1
if (variant != 1) {
  dist1backendSystem = "blue"
}

// Store distribution names for later use
export let distributionDomainNames: { [id: string] : pulumi.Output<string>; } = {}

// Always create CloudFront distribution #1.
// In variant 1 it points to the active backend.
// In variant 2 it always points to the blue backend.
const distribution1 = new aws.cloudfront.Distribution(`${baseName}-distribution1`, {
  origins: [{
      domainName: backends[dist1backendSystem].bucketDomainName,
      originId: backends[dist1backendSystem].bucketArn,
      originAccessControlId: originAccess.id,
  }],
  enabled: true,
  isIpv6Enabled: true,
  defaultRootObject: "index.html",
  aliases: [primaryDomainName],
  defaultCacheBehavior: {
      allowedMethods: ["GET", "HEAD"],
      cachedMethods: ["GET", "HEAD"],
      targetOriginId: backends[dist1backendSystem].bucketArn,
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
      // cloudfrontDefaultCertificate: true,
      acmCertificateArn: cert.certificateArn,
      sslSupportMethod: "sni-only",
  },
});

distributionDomainNames[dist1backendSystem] = distribution1.domainName

// Create an S3 Bucket Policies to allow cloudfront access to the objects.
// In variant 1, this points to the active backend.
// In variant 2, it always points to the blue backend.
const bucket1PolicyJSON = pulumi.all([backends[dist1backendSystem].bucketArn, distribution1.arn]).apply(([bucketArn, distrbutionArn]) => JSON.stringify(
  {
    Version: "2012-10-17",
    Id: `${baseName}CloudFrontAccess1`,
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
)
const bucketPolicy1 = new aws.s3.BucketPolicy(`${baseName}-bucketpolicy1`, {
  bucket: backends[dist1backendSystem].bucketName, // reference to the active bucket created earlier
  policy: bucket1PolicyJSON
})

// If variant other than 1 is set, then create a second distribution and point it to green.
// Also use a hacky alias that doesn't conflict with the alias used for distribution 1.
if (variant != 1) {
  const distribution2 = new aws.cloudfront.Distribution(`${baseName}-distribution2`, {
    origins: [{
        domainName: backends[dist2backendSystem].bucketDomainName,
        originId: backends[dist2backendSystem].bucketArn,
        originAccessControlId: originAccess.id,
    }],
    enabled: true,
    isIpv6Enabled: true,
    defaultRootObject: "index.html",
    aliases: [secondaryDomainName],
    defaultCacheBehavior: {
        allowedMethods: ["GET", "HEAD"],
        cachedMethods: ["GET", "HEAD"],
        targetOriginId: backends[dist2backendSystem].bucketArn,
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
        // cloudfrontDefaultCertificate: true,
        acmCertificateArn: cert.certificateArn,
        sslSupportMethod: "sni-only"
    },
  });

  distributionDomainNames[dist2backendSystem] = distribution2.domainName

  const bucket2PolicyJSON = pulumi.all([backends[dist2backendSystem].bucketArn, distribution2.arn]).apply(([bucketArn, distrbutionArn]) => JSON.stringify(
    {
      Version: "2012-10-17",
      Id: `${baseName}CloudFrontAccess2`,
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
  )

  // Create an S3 Bucket Policies to allow cloudfront access to the objects.
  const bucketPolicy2 = new aws.s3.BucketPolicy(`${baseName}-bucketpolicy2`, {
    bucket: backends[dist2backendSystem].bucketName, // reference to the active bucket created earlier
    policy: bucket2PolicyJSON,
  })
}

// Create the DNS record to point to the active backend system.
const backendDnsName = distributionDomainNames[activeSystem]

const systemDns = new aws.route53.Record(baseName, {
  zoneId: zoneId,
  name: `www.${baseName}`,
  type: "CNAME",
  ttl: 300,
  records: [ backendDnsName ]
})

export const systemUrl = pulumi.interpolate`https://${primaryDomainName}`
export const dnsCnameRecord = systemDns.records
export const selectedSystem = activeSystem

