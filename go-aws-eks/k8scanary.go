package main

import (
	"github.com/pulumi/pulumi-kubernetes/sdk/v3/go/kubernetes"
	appsv1 "github.com/pulumi/pulumi-kubernetes/sdk/v3/go/kubernetes/apps/v1"
	corev1 "github.com/pulumi/pulumi-kubernetes/sdk/v3/go/kubernetes/core/v1"
	metav1 "github.com/pulumi/pulumi-kubernetes/sdk/v3/go/kubernetes/meta/v1"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type K8sCanary struct {
	pulumi.ResourceState
}

func NewK8sCanary(ctx *pulumi.Context, name string, kubeconfig pulumi.StringOutput, opts ...pulumi.ResourceOption) (*K8sCanary, error) {

	var resource K8sCanary
	err := ctx.RegisterComponentResource("pulumi:custom:K8sCanary", name, &resource, opts...)
	if err != nil {
		return nil, err
	}

	k8sProvider, err := kubernetes.NewProvider(ctx, "k8sprovider", &kubernetes.ProviderArgs{
		Kubeconfig: kubeconfig,
	}, pulumi.Parent(&resource))
	if err != nil {
		return nil, err
	}

	namespace, err := corev1.NewNamespace(ctx, "canary-ns", &corev1.NamespaceArgs{
		Metadata: &metav1.ObjectMetaArgs{
			Name: pulumi.String("canary"),
		},
	}, pulumi.Parent(&resource), pulumi.Provider(k8sProvider))
	if err != nil {
		return nil, err
	}

	appLabels := pulumi.StringMap{
		"app": pulumi.String("canary"),
	}
	_, err = appsv1.NewDeployment(ctx, "app-deployment", &appsv1.DeploymentArgs{
		Metadata: &metav1.ObjectMetaArgs{
			Namespace: namespace.Metadata.Elem().Name(),
		},
		Spec: appsv1.DeploymentSpecArgs{
			Selector: &metav1.LabelSelectorArgs{
				MatchLabels: appLabels,
			},
			Replicas: pulumi.Int(3),
			Template: &corev1.PodTemplateSpecArgs{
				Metadata: &metav1.ObjectMetaArgs{
					Labels: appLabels,
				},
				Spec: &corev1.PodSpecArgs{
					Containers: corev1.ContainerArray{
						corev1.ContainerArgs{
							Name:  pulumi.String("appdeploy"),
							Image: pulumi.String("jocatalin/kubernetes-bootcamp:v2"),
						},
					},
				},
			},
		},
	}, pulumi.Provider(k8sProvider))
	if err != nil {
		return nil, err
	}

	// service, err := corev1.NewService(ctx, "app-service", &corev1.ServiceArgs{
	// 	Metadata: &metav1.ObjectMetaArgs{
	// 		Namespace: namespace.Metadata.Elem().Name(),
	// 		Labels:    appLabels,
	// 	},
	// 	Spec: &corev1.ServiceSpecArgs{
	// 		Ports: corev1.ServicePortArray{
	// 			corev1.ServicePortArgs{
	// 				Port:       pulumi.Int(80),
	// 				TargetPort: pulumi.Int(8080),
	// 			},
	// 		},
	// 		Selector: appLabels,
	// 		Type:     pulumi.String("LoadBalancer"),
	// 	},
	// }, pulumi.Provider(k8sProvider))
	// if err != nil {
	// 	return nil, err
	// }

	// hostname := service.Status.ToStringOutput().ApplyT(func(status *corev1.ServiceStatus) *string {
	// 	ingress := status.LoadBalancer.Ingress[0]
	// 	if ingress.Hostname != nil {
	// 		return ingress.Hostname
	// 	}
	// 	return ingress.Ip
	// })

	return &resource, nil
}