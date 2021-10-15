from pulumi import ComponentResource, ResourceOptions
from pulumi_kubernetes import Provider
from pulumi_kubernetes.apps.v1 import Deployment, DeploymentSpecArgs
from pulumi_kubernetes.core.v1 import (
    ContainerArgs,
    ContainerPortArgs,
    Namespace,
    PodSpecArgs,
    PodTemplateSpecArgs,
    Service,
    ServiceAccount,
    ServicePortArgs,
    ServiceSpecArgs,
)
from pulumi_kubernetes.meta.v1 import LabelSelectorArgs, ObjectMetaArgs

class AppArgs:

    def __init__(self,
                provider=None,
                app_name=None,
                app_namespace_name=None,
                image_name=None,
                labels=None,
                replicas=1,
                service_port=None,
                 ):
        self.app_name = app_name
        self.app_namespace_name = app_namespace_name
        self.image_name = image_name
        self.labels = labels
        self.replicas = replicas
        self.service_port = service_port
        self.provider = provider


class App(ComponentResource):

    def __init__(self,
                 name: str,
                 args: AppArgs,
                 opts: ResourceOptions = None):

        super().__init__("custom:resource:App", name, {}, opts)

        k8s_provider = args.provider
        app_labels = args.labels
        app_deployment_name = f"{args.app_name}-app-deployment"
        app_namespace_name = args.app_namespace_name
        service_ports = [ServicePortArgs(port=args.service_port, target_port=args.service_port)]


        # Create the app namespace on the EKS cluster
        self.app_namespace = Namespace(app_namespace_name,
            metadata=ObjectMetaArgs(name=app_namespace_name),
            opts=ResourceOptions(provider=k8s_provider, parent=self),
        )

        self.app_deployment = Deployment(
            app_deployment_name,
            metadata=ObjectMetaArgs(
                labels=app_labels,
                namespace=app_namespace_name,
            ),
            spec=DeploymentSpecArgs(
                selector=LabelSelectorArgs(match_labels=app_labels),
                replicas=args.replicas,
                template=PodTemplateSpecArgs(
                    metadata=ObjectMetaArgs(labels=app_labels),
                    spec=PodSpecArgs(containers=[ContainerArgs(name=args.app_name, image=args.image_name)]),
                    #spec=PodSpecArgs(containers=[ContainerArgs(name=args.app_name, image=args.image_name, ports=[ContainerPortArgs(container_port=80)])]),
                ),
            ),
            opts=ResourceOptions(provider=k8s_provider, parent=self),
        )

        # Create our app service
        app_service_name = f"{args.app_name}-app-service"
        self.app_service = Service(app_service_name,
            metadata=ObjectMetaArgs(
                namespace=app_namespace_name,
            ),
            spec=ServiceSpecArgs(type="NodePort", selector=app_labels, ports=service_ports),
            #spec=ServiceSpecArgs(type="LoadBalancer", selector=app_labels, ports=service_ports),
            opts=ResourceOptions(provider=k8s_provider, parent=self),
        )

        self.register_outputs({})