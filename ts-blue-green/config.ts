import { Config, getProject, getStack, interpolate } from "@pulumi/pulumi";

export const baseName = `${getProject()}-${getStack()}`

const config = new Config()

export const activeSystem = config.require("activeSystem")

