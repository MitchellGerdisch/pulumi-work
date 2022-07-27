terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.43.0"
    }
  }

  backend "s3" {
    bucket = "mitch-tf-backend"
    key    = "tf-state"
    region = "us-east-2"
    profile = "pulumi-ce"
  }
}
