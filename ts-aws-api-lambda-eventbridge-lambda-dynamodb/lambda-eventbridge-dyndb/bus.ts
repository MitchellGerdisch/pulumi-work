import * as pulumi from "@pulumi/pulumi";
import { Input, Output } from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

interface BusArgs {
  reader: Input<string>;
  appName: string;
};


export class Bus extends pulumi.ComponentResource {
  public readonly arn: Output<string>;

  constructor(name: string, args: BusArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:EventProcessor:Bus", name, args, opts)

    const nameBase = `${name}-bus`
    const eventSource = args.appName
    const reader = args.reader

    // Event Bus
    const busName = `${nameBase}-eventBus`
    const eventBus = new aws.cloudwatch.EventBus(busName,{},{parent:this});

    const ruleName = `${nameBase}-eventRule`
    const eventRule = new aws.cloudwatch.EventRule(ruleName, {
      eventBusName: eventBus.name,
      description: "Process events",
      eventPattern: `{
        "source": [
          "${eventSource}"
        ]
      }
      `,
    }, {parent:this});

    const eventTarget = new aws.cloudwatch.EventTarget(`${nameBase}-eventTarget`, {
      rule: eventRule.name,
      arn: reader,
      eventBusName: eventBus.name,
    }, {parent:this})

    this.arn = eventBus.arn
    this.registerOutputs()
  }
}