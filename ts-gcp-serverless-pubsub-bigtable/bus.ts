import * as pulumi from "@pulumi/pulumi";
import { Output } from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

interface BusArgs {
};


export class Bus extends pulumi.ComponentResource {
  public readonly busName: Output<string>

  constructor(name: string, args?: BusArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:EventProcessor:Bus", name, args, opts);

    const nameBase = `${name}-bus`

    const topicName = `${nameBase}-hellos`
    const bus = new gcp.pubsub.Topic(topicName, {}, {parent: this})

    this.busName = bus.name

    this.registerOutputs()
  }
}
