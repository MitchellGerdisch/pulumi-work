export function generateCanaryPolicy(canaryResultsBucketArn: string) {
    return JSON.stringify({
      "Version": "2012-10-17",
      "Statement": [
          {
              "Effect": "Allow",
              "Action": [
                  "s3:PutObject",
                  "s3:GetObject"
              ],
              "Resource": [
                  `${canaryResultsBucketArn}/*`
              ]
          },
          {
              "Effect": "Allow",
              "Action": [
                  "s3:GetBucketLocation"
              ],
              "Resource": [
                  canaryResultsBucketArn
              ]
          },
          // {
          //     "Effect": "Allow",
          //     "Action": [
          //         "logs:CreateLogStream",
          //         "logs:PutLogEvents",
          //         "logs:CreateLogGroup"
          //     ],
          //     "Resource": [
          //         "arn:aws:logs:us-east-1:052848974346:log-group:/aws/lambda/cwsyn-mitch-canary-test-*"
          //     ]
          // },
          {
              "Effect": "Allow",
              "Action": [
                  "s3:ListAllMyBuckets",
                  "xray:PutTraceSegments"
              ],
              "Resource": [
                  "*"
              ]
          },
          {
              "Effect": "Allow",
              "Resource": "*",
              "Action": "cloudwatch:PutMetricData",
              "Condition": {
                  "StringEquals": {
                      "cloudwatch:namespace": "CloudWatchSynthetics"
                  }
              }
          }
      ]
    })
  }