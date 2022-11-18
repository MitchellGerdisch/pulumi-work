import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as k8s from "@pulumi/kubernetes";
import * as ServiceDeployment from "@pulumi/k8s-servicedeployment";

const org = pulumi.getOrganization()
const currentStack = pulumi.getStack()
const project = pulumi.getProject()

const config = new pulumi.Config()
const eksStackProject = config.require("eksProject")
const stackTagName = config.get("stackTagName") ?? "Application"
const stackTagValue = config.get("stackTagValue") ?? "Guestbook"

const eksStackName = `${org}/${eksStackProject}/${currentStack}`
const eksStackRef = new pulumi.StackReference(eksStackName)

const kubeconfig = eksStackRef.requireOutput("kubeconfig") 
const k8sProvider = new k8s.Provider('k8s-provider', {
  kubeconfig: kubeconfig
})

const guestbookNamespace = new k8s.core.v1.Namespace("guestbook-ts-ns", {}, {provider: k8sProvider})
const guestbookNsName = guestbookNamespace.metadata.name

const leader = new ServiceDeployment.ServiceDeployment("redis-leader", {
  namespace: guestbookNsName,
  image: "redis",
  ports: [6379],
}, {provider: k8sProvider})

const replica = new ServiceDeployment.ServiceDeployment("redis-replica", {
  namespace: guestbookNsName,
  image:"pulumi/guestbook-redis-replica",
  ports: [6379],
}, {provider: k8sProvider})

const frontend = new ServiceDeployment.ServiceDeployment("frontend", {
  namespace: guestbookNsName,
  image: "pulumi/guestbook-php-redis",
  replicas: 3,
  ports: [80],
  serviceType: "LoadBalancer",
}, {provider: k8sProvider})

// Test if the "IP" is an IP or a name.
// GKE returns an IP, EKS returns a name
const frontendDnsType = frontend.frontEndIp.apply(ip => {
  let dnsType = "CNAME"
  if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {  
    dnsType = "A"
  }
  return dnsType
})

const dnsName = `guestbook-ts-${pulumi.getStack()}`
const zoneName = config.require("zoneName")
const fqdn = `${dnsName}.${zoneName}`
const zoneId = aws.route53.getZoneOutput({ name: zoneName }).zoneId
const dnsRecord = new aws.route53.Record("frontEndDnsRecord", {
  zoneId: zoneId,
  name: fqdn,
  type: frontendDnsType,
  ttl: 300,
  records: [ frontend.frontEndIp.apply(ip => ip) ]
})

export const frontEndIp = frontend.frontEndIp
export const frontEndUrl = `http://${fqdn}`

const config = new pulumi.Config()
const stackTagName = config.get("stackTagName") ?? "Application"
const stackTagValue = config.get("stackTagValue") ?? "Guestbook"
const stackTag =  new pulumiService.StackTag("stackTag", {
  organization: pulumi.getOrganization(),
  project: pulumi.getProject(),
  stack: pulumi.getStack(),
  name: stackTagName,
  value: pulumi.interpolate`${stackTagValue}-${pulumi.getStack()}`
})