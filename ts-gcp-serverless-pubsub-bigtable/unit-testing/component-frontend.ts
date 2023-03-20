import * as pulumi from "@pulumi/pulumi";
import "mocha";

// SET MOCKS
pulumi.runtime.setMocks({
    newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
        return {
            id: args.inputs.name + "_id",
            state: args.inputs,
        };
    },
    call: function(args: pulumi.runtime.MockCallArgs) {
        return args.inputs;
    },
},
  "project",
  "stack",
  false, // Sets the flag `dryRun`, which indicates if pulumi is running in preview mode.
);
// END OF SET MOCKS

// TESTS

describe("Infrastructure", function() {
  let infra: typeof import("../components/frontend");

  before(async function() {
      // It's important to import the program _after_ the mocks are defined.
      infra = await import("../components/frontend");
  })

  describe("#frontend-component", function() {
    it("must be triggered by http", function(done) {
      pulumi.all([infra.function.urn, infra.server.tags]).apply(([urn, tags]) => {
          if (!tags || !tags["Name"]) {
              done(new Error(`Missing a name tag on server ${urn}`));
          } else {
              done();
          }
      });
  });
      // TODO(check 1): Instances have a Name tag.
      // TODO(check 2): Instances must not use an inline userData script.
  });

  describe("#group", function() {
      // TODO(check 3): Instances must not have SSH open to the Internet.
  });
});
Copy
