package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v5/go/aws/iam"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type EksIam struct {
	pulumi.ResourceState

	eksRoleArn pulumi.StringOutput     `pulumi:"eksRoleArn"`
	nodeGroupRoleArn pulumi.StringOutput     `pulumi:"nodeGroupRoleArn"`
}

func NewEksIam(ctx *pulumi.Context, name string, opts ...pulumi.ResourceOption) (*EksIam, error) {

	var resource EksIam 
	// Stack exports
	err := ctx.RegisterComponentResource("pulumi:custom:EksIam", name, &resource, opts...)
	if err != nil {
		return nil, err
	}

	// Main EKS role
	eksRole, err := iam.NewRole(ctx, "eksRole", &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2008-10-17",
			"Statement": [{
					"Sid": "",
					"Effect": "Allow",
					"Principal": {
							"Service": "eks.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
			}]
	}`),
	}, pulumi.Parent(&resource))
	if err != nil {
		return nil, err
	}

	eksPolicies := []string{
		"arn:aws:iam::aws:policy/AmazonEKSServicePolicy",
		"arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
	}
	for i, eksPolicy := range eksPolicies {
		_, err := iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("rpa-%d", i), &iam.RolePolicyAttachmentArgs{
			PolicyArn: pulumi.String(eksPolicy),
			Role:      eksRole.Name,
		}, pulumi.Parent(&resource))
		if err != nil {
			return nil, err
		}
	}
	// Create the EC2 NodeGroup Role
	nodeGroupRole, err := iam.NewRole(ctx, "nodegroup-iam-role", &iam.RoleArgs{
		AssumeRolePolicy: pulumi.String(`{
			"Version": "2012-10-17",
			"Statement": [{
					"Sid": "",
					"Effect": "Allow",
					"Principal": {
							"Service": "ec2.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
			}]
	}`),
	}, pulumi.Parent(&resource))
	if err != nil {
		return nil, err
	}
	nodeGroupPolicies := []string{
		"arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
		"arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
		"arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
	}
	for i, nodeGroupPolicy := range nodeGroupPolicies {
		_, err := iam.NewRolePolicyAttachment(ctx, fmt.Sprintf("ngpa-%d", i), &iam.RolePolicyAttachmentArgs{
			Role:      nodeGroupRole.Name,
			PolicyArn: pulumi.String(nodeGroupPolicy),
		}, pulumi.Parent(&resource))
		if err != nil {
			return nil, err
		}
	}

	resource.eksRoleArn = eksRole.Arn
	resource.nodeGroupRoleArn = nodeGroupRole.Arn
	ctx.RegisterResourceOutputs(&resource, pulumi.Map{
		"eksRoleArn": eksRole.Arn,
		"nodeGroupRoleArn": nodeGroupRole.Arn,
	})

	return &resource, nil
}