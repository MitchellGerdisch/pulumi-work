import * as pulumi from "@pulumi/pulumi";
import * as pulumiService from "@pulumi/pulumiService";

const config = new pulumi.Config()
const stackTagName = config.get("stackTagName") ?? "Application"
const stackTagValue = config.get("stackTagValue") ?? "Guestbook"

// Add Pulumi stack tag
export const stackTag =  new pulumiService.StackTag("stackTag", {
  organization: pulumi.getOrganization(),
  project: pulumi.getProject(),
  stack: pulumi.getStack(),
  name: tagName,
  value: tagValue
})