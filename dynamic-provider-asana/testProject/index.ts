import * as pulumi from "@pulumi/pulumi";
import { AsanaTask } from "../AsanaDynamicProvider/asanaDynamicProvider";


const asanaTask = new AsanaTask("mitch-dyn-test", {
  taskName: "mitch-dyn-test",
  projectGid: '1207315423832138'
})

