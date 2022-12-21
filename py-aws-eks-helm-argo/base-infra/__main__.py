"""
- Creates VPC
- Instantiates EKS cluster
- Deploys ArgoCd Operator
"""

import pulumi
from pulumi.resource import ResourceOptions
from pulumi_eks import ClusterArgs, Cluster 
import pulumi_kubernetes as k8s

from Network import Vpc, VpcArgs
from Operator import ArgoCd, ArgoCdArgs

### Config
config = pulumi.Config()
basename = config.get("basename") or "argo-demo"

### create VPC
vpc = Vpc(basename, VpcArgs())

### create an EKS cluster
cluster = Cluster(basename, ClusterArgs(
    vpc_id=vpc.id,
    max_size=4,
))
pulumi.export("kubeconfig", pulumi.Output.secret(cluster.kubeconfig))

# Instantiate K8s provider based on kubeconfig from the base infrastructure stack
k8s_provider = k8s.Provider('k8s-provider', kubeconfig=cluster.kubeconfig, delete_unreachable=True)

### Deploy Operator
operator = ArgoCd(basename, ArgoCdArgs(), opts=ResourceOptions(provider=k8s_provider))
pulumi.export("service_url", operator.service_url)
pulumi.export("admin_username", operator.service_admin_username)
pulumi.export("admin_password", operator.service_admin_password)
pulumi.export("operator_namespace", operator.operator_ns)

