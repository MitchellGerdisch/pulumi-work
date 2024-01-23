import { Config, getProject, getStack, interpolate } from "@pulumi/pulumi";

export const baseName = `${getProject()}-${getStack()}`

const config = new Config()

export const activeSystem = config.require("activeSystem")

export const zoneName = config.get("zoneName") || "pulumi-ce.team"
export const zoneId = config.get("zoneId") || "Z1MOFT0W6HPL6N"

// See README.md for discussion about variants.
// This code can be used to see how the different approaches can work.
export const variant = config.getNumber("variant") || 1




