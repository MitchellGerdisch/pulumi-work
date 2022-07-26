# Base VPC and Related Infra - Derived from Terraform Deployed Infra
This is a simple stack that uses Pulumi's terraform package to access the state (in S3) of a Terraform-deployed stack.
The Terraform-deployed stack creates a VPC and subnets and route tables, etc.
This Pulumi stack accesses the Terraform-deployed stack's state and exposes the information needed by other Pulumi stacks.

## Terraform Stack
The Terraform stack is found in the `base-infra-tf` folder and can be deployed as follows:
```
cd base-vpc-tf
terraform init
terraform plan
terraform apply
```

## Pulumi Base VPC stack
The Pulumi base VPC stack which is used to share the TF-deployed resource information with other Pulumi stacks is deployed as follows:
```
pulumi stack init dev
pulumi up
```