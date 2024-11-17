import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Create an IAM role for the Lambda function
const role = new aws.iam.Role("lambdaRole", {
    assumeRolePolicy: {
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Principal: {
                Service: "lambda.amazonaws.com",
            },
            Effect: "Allow",
        }],
    },
});

// Attach the AWSLambdaBasicExecutionRole policy to the role
const rolePolicyAttachment = new aws.iam.RolePolicyAttachment("lambdaRolePolicyAttachment", {
    role: role.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Create the Lambda function
const lambda = new aws.lambda.Function("myLambda", {
    runtime: "nodejs18.x",
    role: role.arn,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./lambda"), // Assumes your Lambda code is in the 'lambda' directory
    }),
    environment: {
        variables: {
            MY_LENGTH: "7",
            MY_WIDTH: "8",
        },
    },
});

// Export the Lambda function name and ARN
export const lambdaName = lambda.name;
export const lambdaArn = lambda.arn;
