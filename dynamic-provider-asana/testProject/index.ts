import * as pulumi from "@pulumi/pulumi";
import { AsanaTask } from "../AsanaDynamicProvider-EnvVarCreds/asanaDynamicProvider";
// import { AsanaTask } from "../AsanaDynamicProvider-ConfigCreds/asanaDynamicProvider";

const asanaTask = new AsanaTask("mitch-dyn-test", {
  taskName: "my-asana-dynamicprovider-task",
  projectGid: '1207315423832138'
})

