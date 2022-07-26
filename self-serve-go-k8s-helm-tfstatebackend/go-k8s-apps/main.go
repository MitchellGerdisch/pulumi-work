package main

import (
	"fmt"

	"github.com/pulumi/pulumi-kubernetes/sdk/v3/go/kubernetes"
	// appsv1 "github.com/pulumi/pulumi-kubernetes/sdk/v3/go/kubernetes/apps/v1"
	corev1 "github.com/pulumi/pulumi-kubernetes/sdk/v3/go/kubernetes/core/v1"
	metav1 "github.com/pulumi/pulumi-kubernetes/sdk/v3/go/kubernetes/meta/v1"
	"github.com/pulumi/pulumi-kubernetes/sdk/v3/go/kubernetes/helm/v3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
	"github.com/pulumi/pulumi-pulumiservice/sdk/go/pulumiservice"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {

		// Get the base eks stack kubeconfig
		conf := config.New(ctx, "")
    eksStackName := conf.Require("eksStackName")

		orgName := conf.Require("orgName")
		appName := conf.Require("appName")

		_, err := pulumiservice.NewStackTag(ctx, "stackTag", &pulumiservice.StackTagArgs{
			Name: pulumi.String("Application"),
			Value: pulumi.String(appName),
			Organization: pulumi.String(orgName),
			Project: pulumi.String(ctx.Project()),
			Stack: pulumi.String(ctx.Stack()),
		}, nil)
		if err != nil {
			return fmt.Errorf("error creating StackTag: %v", err)
		}

		eksStackRef, err := pulumi.NewStackReference(ctx, eksStackName, nil)
		if err != nil {
    	return err
		}

		kubeconfig := eksStackRef.GetStringOutput(pulumi.String("kubeconfig"))

		k8sProvider, err := kubernetes.NewProvider(ctx, "k8sprovider", &kubernetes.ProviderArgs{
			Kubeconfig: kubeconfig,
		})

		// appNamespace, err := corev1.NewNamespace(ctx, "wordpress-ns", &corev1.NamespaceArgs{
		_, err = corev1.NewNamespace(ctx, "wordpress-ns", &corev1.NamespaceArgs{
			Metadata: &metav1.ObjectMetaArgs{
				Name: pulumi.String("wordpress-ns"),
			},
		}, pulumi.Provider(k8sProvider))
		if err != nil {
			return err
		}

		// Deploy the bitnami/wordpress chart.
		wordpress, err := helm.NewRelease(ctx, "wpdev", &helm.ReleaseArgs{
			Version: pulumi.String("15.0.12"),
			Chart:   pulumi.String("wordpress"),
			Values:  pulumi.Map{"service": pulumi.StringMap{"type": pulumi.String("ClusterIP")}},
			// Namespace: appNamespace.Metadata.Name(),
			RepositoryOpts: &helm.RepositoryOptsArgs{
				Repo: pulumi.String("https://charts.bitnami.com/bitnami"),
			},
			
		}, pulumi.Provider(k8sProvider))
		if err != nil {
			return err
		}

		// Await on the Status field of the wordpress release and use that to lookup the WordPress service.
		result := pulumi.All(wordpress.Status.Namespace(), wordpress.Status.Name()).ApplyT(func(r interface{}) ([]interface{}, error) {
			arr := r.([]interface{})
			namespace := arr[0].(*string)
			name := arr[1].(*string)
			svc, err := corev1.GetService(ctx, "svc", pulumi.ID(fmt.Sprintf("%s/%s-wordpress", *namespace, *name)), nil, pulumi.Provider(k8sProvider))
			if err != nil {
				return nil, err
			}

			// Return the cluster IP and service name
			return []interface{}{svc.Spec.ClusterIP().Elem(), svc.Metadata.Name().Elem()}, nil
		})

		arr := result.(pulumi.ArrayOutput)
		ctx.Export("frontendIp", arr.Index(pulumi.Int(0)))
		ctx.Export("portForwardCommand", pulumi.Sprintf("kubectl port-forward svc/%s 8080:80", arr.Index(pulumi.Int(1))))


		// _, err := helm.NewRelease(ctx, "nginx-ingress", helm.ReleaseArgs{
		// 	Chart:   pulumi.String("nginx-ingress"),
		// 	Version: pulumi.String("1.24.4"),
		// 	RepositoryOpts: helm.RepositoryOptsArgs{
		// 		Repo: pulumi.String("https://charts.helm.sh/stable"),
		// 	},
		// }, pulumi.Provider(k8sProvider))
		// if err != nil {
		// 	return err
		// }

		return nil

	})
}
