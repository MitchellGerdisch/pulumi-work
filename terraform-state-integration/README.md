# Base VPC and Related Infra - Derived from Terraform Deployed Infra
Demonstrates how to Pulumi's terraform package to access the state (in S3 in this case) of a Terraform-deployed stack.
The Terraform-deployed stack creates a VPC and subnets and route tables, etc.
This Pulumi stack accesses the Terraform-deployed stack's state and uses the TF-managed infrastructure to create other resources.

## Launch Terraform Stack
The Terraform stack is found in the `terraform-vpc-project` folder.

Prerequisites:
* Logged into AWS
* An AWS S3 bucket to use for Terraform state.
* Updated `backend.tf` to refrence the bucket's name. (i.e. replace `mitch-tf-backend` with your bucket name)

Steps to launch terraform stack:
```
cd terraform-vpc-project
terraform init
terraform plan
terraform apply
```

## Launch Pulumi Stack

Prerequisites:
* Name of Terraform state S3 bucket (see above).

The Pulumi base VPC stack which is used to share the TF-deployed resource information with other Pulumi stacks is deployed as follows:
```
cd pulumi-project
pulumi config set tf_state_bucket YOUR_BUCKET_NAME
pulumi stack init dev
pulumi up
```

## Clean Up
```
cd pulumi-project
pulumi destroy
cd ../terraform-vpc-project
terraform destroy
```

## Related Repos/Code
[Import and Convert Examples](https://github.com/MitchellGerdisch/pulumi-import-and-convert-examples): This repo has examples of importing resources from TF state as well as converting TF code: