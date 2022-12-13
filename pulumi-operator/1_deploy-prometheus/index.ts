import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as kx from "@pulumi/kubernetesx";

// See https://github.com/pulumi/pulumi-kubernetes-operator/blob/master/docs/metrics.md
const promOperator = new k8s.helm.v3.Release("prom-operator", {
    name: "kube-prometheus-stack",
    chart: "kube-prometheus-stack",
    repositoryOpts: {
        repo: "https://prometheus-community.github.io/helm-charts",
    },
    values: {
        prometheus: {
            prometheusSpec: {
                serviceMonitorSelectorNilUsesHelmValues: false,
            },
        },
    },
});