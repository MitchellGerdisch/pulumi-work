# Copyright 2016-2022, Pulumi Corporation.  All rights reserved.

"""A Kubernetes Python Pulumi program to deploy a Wordpress chart"""

import pulumi
from pulumi import Output
from pulumi.resource import ResourceOptions
import pulumi_kubernetes as k8s
from pulumi_kubernetes.core.v1 import Service
from pulumi_kubernetes.helm.v3 import Release, ReleaseArgs, RepositoryOptsArgs

config = pulumi.Config()
org = config.require("org")
base_stack_project = config.require("base_stack_project")
stack = pulumi.get_stack()
base_stack_name = f'{org}/{base_stack_project}/{stack}'

base_stack_ref = pulumi.StackReference(base_stack_name)
kubeconfig = base_stack_ref.require_output("kubeconfig")
pulumi.export("kubeconfig", kubeconfig)

k8s_provider = k8s.Provider('k8s-provider', kubeconfig=kubeconfig)

# Deploy the bitnami/wordpress chart.
wordpress = Release(
    "wpdev",
    ReleaseArgs(
        chart="wordpress",
        repository_opts=RepositoryOptsArgs(
            repo="https://charts.bitnami.com/bitnami",
        ),
        # Use ClusterIP so no assumptions on support for load balancers, etc. is required.
        version="13.0.6",
        values={
            "service": {
                "type": "ClusterIP",
            }
        },
    ),
    ResourceOptions(provider=k8s_provider))

srv = Service.get("wpdev-wordpress", Output.concat(wordpress.status.namespace, "/", wordpress.status.name, "-wordpress"), ResourceOptions(provider=k8s_provider))
# Export the Cluster IP for Wordpress.
pulumi.export("frontendIp", srv.spec.cluster_ip)
# Command to run to access the wordpress frontend on localhost:8080
cmd = Output.concat("kubectl port-forward svc/", srv.metadata.name, " 8080:80")
pulumi.export("portForwardCommand", cmd)
