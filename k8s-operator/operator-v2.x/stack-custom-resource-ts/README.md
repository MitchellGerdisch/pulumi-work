# Stack Custom Resource Example

Key things to note:
* Be sure the `Pulumi.dev.yaml` config points to the `org/project/stack` you are want to manage with the stack custom resource.
* Be sure to update `config.ts` to point at the correct github repo. The code as it is now makes some assumptions based on the `org/project` name.