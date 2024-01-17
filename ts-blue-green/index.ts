/*
 * Blue-Green demo.
 * Basic model is as follows:
 * - A "blue" system
 * - A "green" system
 * - One of these systems is the currently active system
 * - DNS record that points at the currently active system.
 * - Pulumi up drives an update based on some config value that indicates which system is active.
 *   - Of course, the update may also update content for the system to be made active.
 * 
 */
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { Backend, BackendProperties } from "./backend_component"

import { activeSystem, baseName  } from "./config"

const systems: string[] = ["blue", "green"]
let backends: { [id: string] : BackendProperties; } = {}

for (let system of systems) {
  const backend = new Backend(`${baseName}-${system}`, {
    indexDocumentPath: `./${system}/index.html`
  })
  backends[system] = backend.backendProperties
}


// Export the names of the bucket and the CloudFront distribution
// export const cdnUrl = distribution.domainName;
