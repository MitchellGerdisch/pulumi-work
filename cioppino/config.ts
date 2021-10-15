import * as pulumi from "@pulumi/pulumi";
import * as tls from "@pulumi/tls";

const config = new pulumi.Config();

export const projectName = pulumi.getProject()
export const stackName = pulumi.getStack()
export const nameBase = config.get("nameBase") || projectName;
export const instanceCount = config.getNumber("instanceCount") || 1;

export const vmSshKey = new tls.PrivateKey(`${nameBase}-vm-sshkey`, 
    {
        algorithm: "RSA",
    });

export const baseTags = {
    "cost-center": projectName,
    "stack": stackName,
};