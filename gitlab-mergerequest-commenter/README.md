# Gitlab Merge Request Comments
This project demonstrates a gitlab CI pipeline that uses the `add_mr_note.sh` script to add `pulumi preview` output to a Gitlab Merge Request. It's pretty basic at this point, but provides the preview output in a readable fashion. 

The idea is to emulate what the gitlab webhook integration provides as shown here:
https://www.pulumi.com/docs/guides/continuous-delivery/gitlab-ci/#enhance-merge-requests-with-pulumi

However the current webhook implementation requires that the user be a gitlab SSO managed user.
See: https://github.com/pulumi/service-requests/issues/44 

## Getting started
* Create a gitlab repository with the contents of this repo.
* Add gitlab pipeline variables for:
  * PULUMI_ACCESS_TOKEN = a pulumi access token
  * GITLAB_ACCESS_TOKEN = a Gitlab access token

## Running the Example
* Push a branch with some change to `index.ts` or `Pulumi.main.yaml`
* This will trigger a deploy pipeline for the branch which is not all that important and could arguably be removed from the pipeline.
* Create a Merge Request for the branch.
* This will trigger a merge_request pipeline and you should see the preview against main being added as a comment to the Merge Request.

## TODOS
* Add more formatting to the comment to have colors and the like ala https://github.com/pulumi/pulumi-service/blob/b64024a4cc0acec1db303830cb11ce5a2aee6b2b/cmd/service/workflow/output.go#L580 
* Create a go version of `add_mr_note.sh` so it can be compiled for different runners (e.g. Linux or Windows)