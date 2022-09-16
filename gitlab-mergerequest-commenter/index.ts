import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";

const config = new pulumi.Config()
const min = config.getNumber("min") || 1
const max = config.getNumber("max") || 2323

const rando = new random.RandomInteger("rando", {
  min: min,
  max: max,
})
