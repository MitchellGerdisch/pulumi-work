import * as pulumi from "@pulumi/pulumi"
import { Input, Output } from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes"
import * as aws from "@pulumi/aws"
import * as eks from "@pulumi/eks"
import { ingressCtlIamPolicyJson } from "./utils/ingress-ctl-jsons"

interface IngressCtlArgs {
  k8sProvider: k8s.Provider;
  oidcProviderArn: Input<string> | undefined;
  oidcProviderUrl: Input<string> | undefined;
  clusterName: Input<string>;
  vpcId: Input<string>;
  awsRegion: Input<string>;
  namespaceName: Input<string>;
};

export class IngressCtl extends pulumi.ComponentResource {

  constructor(name: string, args: IngressCtlArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:x:IngressController", name, args, opts);

    const k8sProvider = args.k8sProvider
    const oidcProviderArn = args.oidcProviderArn || "oidcProviderArn undefined"
    const oidcProviderUrl = args.oidcProviderUrl || "oidcProviderUrl undefined"
    const clusterName = args.clusterName
    const vpcId = args.vpcId
    const awsRegion = args.awsRegion
    const namespaceName = args.namespaceName

    const controller_name = `${name}-alb-controller`
    const serviceAccountName = "aws-lb-controller-serviceaccount"
    const serviceAccountFull = `system:serviceaccount:${namespaceName}:${serviceAccountName}`

    // Using the helm chart to deploy the AWS ALB controller as per:
    // https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/deploy/installation/
    // 
    // The code below is based on the instructions for the helm chart as well as this workshop:
    // https://pulumi.awsworkshop.io/50_eks_platform/30_deploy_ingress_controller.html

    // Create the assume_role_policy based on the cluster OIDC provider properties.
    const assumeRolePolicy = pulumi.all([oidcProviderArn, oidcProviderUrl]).apply(([oidcProviderArn, oidcProviderUrl]) => 
     `{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "Federated": "${oidcProviderArn}" 
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
              "StringEquals": {
                "${oidcProviderUrl}:sub": "${serviceAccountFull}"
              }
            }
          }
        ]
      }`
    )

    const ingressCtlIamRole = new aws.iam.Role(`${name}-ingress-ctl-iam-role`, {
      description: "Permissions required by the Kubernetes AWS ALB Ingress controller to do it's job.",
      forceDetachPolicies: true,
      assumeRolePolicy: assumeRolePolicy,
    }, {parent: this})
      
    // Set up IAM policy using the permissions provided alongside the helm chart and found here:
    // https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.1.2/docs/install/iam_policy.json
    // and stored locally in ingress_ctl_jsons.py
    const ingressCtlIamPolicy = new aws.iam.Policy(`${name}-ingress-ctl-iam-policy`, {
      policy: JSON.stringify(ingressCtlIamPolicyJson),
    }, {parent: this, dependsOn: ingressCtlIamRole})

    // Attach the policy to the role created above
    const ingressCtlRoleAttachment = new aws.iam.PolicyAttachment(`${name}-ingress-ctl-iam-role-attachment`, {
      policyArn: ingressCtlIamPolicy.arn,
      roles: [ingressCtlIamRole.name],
    }, {parent: this, dependsOn: [ingressCtlIamRole]})

    // Create a namespace in which to deploy the controller
    const controllerNamespace = new k8s.core.v1.Namespace(`${namespaceName}`, {
      metadata: {
        name: namespaceName,
			  labels: {"app.kubernetes.io/name": "aws-load-balancer-controller"}
      }
    }, {parent: this, provider: k8sProvider})

    const ingressCtlK8sServiceAccount = new k8s.core.v1.ServiceAccount(`${serviceAccountName}`, {
      metadata: {
        name: serviceAccountName,
        namespace: controllerNamespace.metadata.name,
        annotations: {"eks.amazonaws.com/role-arn": ingressCtlIamRole.arn.apply(arn => arn)},
      }, 
    }, {parent: this, provider: k8sProvider, dependsOn: [ingressCtlRoleAttachment]})


    // Chart found here: https://artifacthub.io/packages/helm/aws/aws-load-balancer-controller
    const albControllerName = `${name}-alb-controller`
    const albController = new k8s.helm.v3.Chart(albControllerName, {
      chart: "aws-load-balancer-controller", // Get this from the second line of the helm chart artifact hub TL;DR
      fetchOpts: {
        repo:"https://aws.github.io/eks-charts" // Get this from the first line of the helm chart artifcat hub TL;DR
      },
      namespace: controllerNamespace.metadata.name,
      // Need to set these values as per the chart docs
      values:{
        "region":awsRegion,
        "vpcId":vpcId,
        "clusterName":clusterName, 
        "serviceAccount": {
        // Need to assign the ServiceAccount created above. 
        // Without this, the helm chart creates a ServiceAccount but it doesn't have the permissions needed to allow the controller to create ALBs.
          "create": false,
          "name": serviceAccountName, 
        },
        "podLabels": {
          "app": "aws-lb-controller"
        }
      },
    }, {parent: this, provider: k8sProvider, dependsOn:[ingressCtlK8sServiceAccount]})

    this.registerOutputs()
  }
}
