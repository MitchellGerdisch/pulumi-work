# dynamic-provider-asana
A Pulumi Dynamic Provider that interacts with an Asana account to create tasks in a project.
See https://developers.asana.com/docs/overview

It is a quite minimal in that it does not support update or diffs, etc. 
It only supports create and delete.

It exclusively uses environment variables for setting up the provider credentials since this was written as a test bed 
for the idea of using environment variables (especially for the access token) as a way of preventing any issues during destroy if the token is refreshed.
This is pretty common for cases where temporary credentials are used.

## Set Up
REQUIRES the following environment variables:
* `ASANA_WORKSPACE_GID`: this is the Asana workspace in which the resources are created. 
  * It can be found by logging into Asana and then going here: https://app.asana.com/api/1.0/workspaces?opt_pretty
* `ASANA_ACCESS_TOKEN`: this is a PAT for Asana.
  * See https://developers.asana.com/docs/quick-start for how to get a personal access token.

If you want to use the dev stack config as-is, set up an ESC environment in Pulumi Cloud named `asana-access` that looks like:
```
values:
  asana:
    workspaceGid: YOUR_WORKSPACE_GID_GOES_HERE
    access_token:
      fn::secret: YOUR_ASANA_PERSONAL_ACCESS_TOKEN_GOES_HERE
  environmentVariables:
    ASANA_WORKSPACE_GID: ${asana.workspaceGid}
    ASANA_ACCESS_TOKEN: ${asana.access_token}
```

You also need to identify a project in which to create the task and get the GID for the project. 
* You can find the project(s) GID(s) by logging into Asana and then going here: https://app.asana.com/api/1.0/workspaces/WORKSPACE_GID/projects?opt_pretty
  * Where `WORKSPACE_GID` is the same as the value you used for `ASANA_WORKSPACE_GID` above.

## Using
* From the top folder, `npm i`
* `cd testProject`
* `pulumi up`
   * You should see a task created in the given project.
* If testing the premise described above, change the personal access token and update the `asana-access` environment with the new value.
* `pulumi destroy`
