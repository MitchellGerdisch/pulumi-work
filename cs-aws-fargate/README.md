# aws-cs-fargate

C# example of deploying ECR, Docker, and ECS

## Troubleshooting
If you get an error about "error reading push output: denied: You authorization token has expired" then do the following:
* Find the URL for the ECR that was created.
* Run `aws ecr get-login-password |docker login --username AWS --password-stdin $IMAGE_PATH` where `$IMAGE_PATH` is the the URL for the ECR that was created.