# EKS on Fargate

To use:

- Launch VPC stack:
  - cd vpc
  - pulumi up
- Launch eks stack:
  - cd ../eks
  - pulumi up

# Notes

- EKS on Fargate requires using the AWS ALB ingress controller. This controller creates ALBs when an ingress is created.
- The ALB Ingress controller is installed using a Helm Chart.
