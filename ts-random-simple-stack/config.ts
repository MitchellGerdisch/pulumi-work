import * as pulumi from "@pulumi/pulumi";
import { readFileSync }from 'fs';

const config = new pulumi.Config();

export const petLength = config.getNumber("petLength") ?? 3

// Pulumi Deployments also lets you add pre-run code in the UI (unders the Settings->Deploy tab for the given stack).
// This bit here can be used to show that use-case by adding the following code to the pre-run code to write a value to a file 
// that is then processed by the pulumi program:
// echo SOME_STRING_OF_YOUR_CHOOSING > ./pet-name-prefix.txt
// e.g. echo myprefix > ./pet-name-prefix.txt
var petNamePrefix
try {
  petNamePrefix = readFileSync('./pet-name-prefix.txt').toString().trim()
} catch {
  petNamePrefix = ""
}
export { petNamePrefix }

