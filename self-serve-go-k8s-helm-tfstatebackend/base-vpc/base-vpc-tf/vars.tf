variable "AWS_REGION" {
  default = "us-east-2"
}

variable "availability_zones" {
  description = "AZs in this region to use"
  default = ["us-east-2a", "us-east-2c"]
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  default = "10.0.0.0/16"
}

variable "subnet_cidrs_public" {
  description = "Subnet CIDRs for public subnets (length must match configured availability_zones)"
  default = ["10.0.10.0/24", "10.0.20.0/24"]
}