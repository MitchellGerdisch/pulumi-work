import * as pulumi from "@pulumi/pulumi";
import { Output } from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

interface BusArgs {
};


export class Bus extends pulumi.ComponentResource {
  public readonly busName: Output<string>
  public readonly subscriptionName: Output<string>

  constructor(name: string, args?: BusArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:EventProcessor:Bus", name, args, opts);

    const nameBase = `${name}-bus`

    const topicName = `${nameBase}-hellos`
    const bus = new gcp.pubsub.Topic(topicName, {}, {parent: this})

    const subscription = new gcp.pubsub.Subscription(`${topicName}-sub`, {
      topic: bus.name,
      messageRetentionDuration: "1200s",
      retainAckedMessages: true,
      ackDeadlineSeconds: 20,
      expirationPolicy: {
        ttl: "300000.5s",
      },
      retryPolicy: {
        minimumBackoff: "10s"
      },
      enableMessageOrdering: false
    }, {parent: this})

    this.busName = bus.name
    this.subscriptionName = subscription.name

    this.registerOutputs()
  }
}
