"""
- Creates VPC
- Instantiates EKS cluster
"""

import pulumi
from pulumi_eks import ClusterArgs, Cluster 

from Network import VpcArgs, Vpc

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
