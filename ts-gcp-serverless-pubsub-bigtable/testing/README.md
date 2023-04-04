# testing options
Some examples of testing for this stack and realated component resources.

Unit testing is supported in Pulumi including setting mocks.  
See: https://www.pulumi.com/docs/guides/testing/unit/

However for unit testing to work with Typescript, one needs to export resources left and right. And for component resources, this quickly devolves to exposing much more resource-wise than you probably want.

There a couple of github issues to address this:
- https://github.com/pulumi/pulumi/issues/6113
- https://github.com/pulumi/pulumi/issues/6666

To that end, I wanted to play with using Policy as Code (https://www.pulumi.com/docs/guides/crossguard/) to test the components and their settings.  

The `run_tests.sh` runs through a list of "test" policy-packs (hard-coded in the shell script) and runs `pulumi preview --policy-pack` against the `single-project` code and looks for errors in the component resource being tested by the given policy-pack.

