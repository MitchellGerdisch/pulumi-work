#  Copyright 2016-2020, Pulumi Corporation.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import pulumi
from pulumi.resource import ResourceOptions
import pulumi_kubernetes as k8s
from pulumi_k8s_servicedeployment import ServiceDeployment, ServiceDeploymentArgs

# Minikube does not implement services of type `LoadBalancer`; require the user to specify if we're
# running on minikube, and if so, create only services of type ClusterIP.
config = pulumi.Config()
isMinikube = config.get_bool("isMinikube")
org = config.require("org")
eks_stack_project = config.require("eksProject")
current_stack = pulumi.get_stack()
project = pulumi.get_project()
eks_stack_name = f"{org}/{eks_stack_project}/{current_stack}"
eks_stack_ref = pulumi.StackReference(eks_stack_name)

kubeconfig = eks_stack_ref.require_output("kubeconfig") 
k8s_provider = k8s.Provider('k8s-provider', kubeconfig=kubeconfig)

guestbook_ns = k8s.core.v1.Namespace("guestbook-py-ns", 
    ResourceOptions(provider=k8s_provider))

guestbook_ns_name = guestbook_ns.metadata.name

leader = ServiceDeployment("redis-leader", ServiceDeploymentArgs(
    namespace=guestbook_ns_name,
    image="redis",
    ports=[6379]),
    ResourceOptions(provider=k8s_provider))

replica = ServiceDeployment("redis-replica", ServiceDeploymentArgs(
    namespace=guestbook_ns_name,
    image="pulumi/guestbook-redis-replica",
    ports=[6379]),
    ResourceOptions(provider=k8s_provider))

frontend = ServiceDeployment("frontend", ServiceDeploymentArgs(
    namespace=guestbook_ns_name,
    image="pulumi/guestbook-php-redis",
    replicas=3,
    ports=[80],
    service_type="LoadBalancer"),
    ResourceOptions(provider=k8s_provider))

front_end_url = pulumi.Output.concat("http://", frontend.front_end_ip)
pulumi.export("front_end_url", front_end_url)

