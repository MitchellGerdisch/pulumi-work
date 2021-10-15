import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";

const nameBase = "mitch"
const static_ste_example = new digitalocean.App(`${nameBase}-static-site`, {
    spec: {
        name: `${nameBase}-static-site`,
        region: "nyc1",
        staticSites: [{
            github: { // MUST use github (vs git) spec for private repo
              branch: "main",
              deployOnPush: true,
              repo: "MitchellGerdisch/simple_static_website",
            },
            name: `${nameBase}-hello-world`,
        }],
    },
});
