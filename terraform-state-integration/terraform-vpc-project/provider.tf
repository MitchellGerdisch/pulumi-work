provider "aws" {
  region = "${var.AWS_REGION}"
  profile = "pulumi-ce"
}