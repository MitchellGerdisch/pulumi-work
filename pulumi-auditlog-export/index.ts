/* 
 * This project creates the S3 bucket and folder and IAM policy and role used for the Pulumi Service
 * audit logs S3 bucket export capability.
 * It also (or will) hits the Pulumi Service API to configure the settings.
 */
import * as aws from "@pulumi/aws";
import { Config } from "@pulumi/pulumi";
import { PulumiAuditLogs } from "./pulumi-auditlogs"

const config = new Config()
const orgName = config.require("orgName") // name of organization in which S3 audit log dump is being configured
const logsBaseName = config.get("logsBaseName") || "pulumiAuditLogs"
const logsBucketFolderName = config.get("bucketLogsFolder") || "PulumiAuditLogs"

// Create the S3 bucket to which audit logs will be exported
const logsBucket = new aws.s3.Bucket(`${logsBaseName}`, {
    acl: "private",
    forceDestroy: true // when we destroy this stack, all the logs exported to this bucket are going bye bye.
});
const logsBucketFolder = new aws.s3.BucketObject(logsBucketFolderName, {
    bucket: logsBucket.id,
    key: `${logsBucketFolderName}/`
})
export const auditLogsBucketName = logsBucket.id;
export const auditLogsPrefixName = `${logsBucketFolderName}`

// Create an IAM role with the necessary policy
const logsIamRole = new aws.iam.Role(`${logsBaseName}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                "AWS": "arn:aws:iam::058607598222:root"
            },
            Condition: {
              "StringEquals": {
                "sts:ExternalId": orgName
              }
            }
        }],
    }),
});
export const logsIamRoleName = logsIamRole.name
export const logsIamRoleArn = logsIamRole.arn

// Create IAM Policy as per the instructions and attach to the role above.
const logsIamPolicy = new aws.iam.RolePolicy(`${logsBaseName}`, {
    role: logsIamRole.id,
    policy: logsBucket.id.apply(bucketName => JSON.stringify({
      "Statement": [
          {
              "Action": [
                  "s3:GetBucketLocation"
              ],
              "Effect": "Allow",
              "Resource": [
                  "arn:aws:s3:::"+bucketName 
              ]
          },
          {
              "Action": [
                  "s3:PutObject",
                  "s3:PutObjectAcl",
                  "s3:AbortMultipartUpload"
              ],
              "Effect": "Allow",
              "Resource": [
                  "arn:aws:s3:::"+bucketName+"/"+logsBucketFolderName,
                  "arn:aws:s3:::"+bucketName+"/"+logsBucketFolderName+"/*",
              ]
          }
      ],
      "Version": "2012-10-17"
    })),
})
export const logsIamPolicyName = logsIamPolicy.name

const pulumiAuditLogExport = new PulumiAuditLogs(`${orgName}-AuditLogsExport`, {
    pulumiApiKey: config.requireSecret("pulumiApiKey"),
    orgName: orgName,
    bucketName: auditLogsBucketName,
    prefixName: logsBucketFolderName,
    iamRoleArn: logsIamRole.arn,
})
export const pulumiAuditLogExportUrn = pulumiAuditLogExport.urn


