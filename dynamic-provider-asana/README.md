# dynamic-provider-asana
A Pulumi Dynamic Provider that interacts with an Asana account to create tasks in a project.
See https://developers.asana.com/docs/overview

It is a quite minimal in that it does not support update or diffs, etc. 
It only supports create and delete.

The goal for creating this example was to look for ways to pass credentials to the provider WITHOUT having to pass them in as arguments when creating the resource itself.

There are two variations on the theme presented:
* AsanaDynamicProvider-EnvVarCreds
* AsanaDynamicProvider-ConfigCreds

## AsanaDynamicProvider-EnvVarCreds
It exclusively uses environment variables for setting up the provider credentials.

This approach (using environment variables as shown in the code) prevents any issues during destroy if the token is refreshed.
This is pretty common for cases where temporary credentials are used.

## AsanaDynamicProvider-ConfigCreds
It uses Pulumi.Config() for setting up the provider credentials.

Unlike the environment variable example, this this approach does not prevent the issue where a destroy fails if the token is refreshed.
To work around this case, an update needs to be run before the destroy.

### Set Up
The easiest way to test this code is to use a Pulumi ESC Environment that looks like:
```
values:
  asana:
    workspaceGid: YOUR_WORKSPACE_GID_GOES_HERE
    access_token:
      fn::secret: YOUR_ASANA_PERSONAL_ACCESS_TOKEN_GOES_HERE
  environmentVariables:
    ASANA_WORKSPACE_GID: ${asana.workspaceGid}
    ASANA_ACCESS_TOKEN: ${asana.access_token}
  pulumiConfig:
    asanaWorkspaceGid: ${asana.workspaceGid}
    asanaAccessToken: ${asana.access_token}
```

The `Pulumi.dev.yaml` that accompanies the `testProject` assumes you've set up an environment as above and named it `asana-access`

#### Obtaining the Asana Credentials
* Workspace GID: This is the Asana workspace in which the resources are created. 
  * It can be found by logging into Asana and then going here: https://app.asana.com/api/1.0/workspaces?opt_pretty
* Access Token`: this is a PAT for Asana.
  * See https://developers.asana.com/docs/quick-start for how to get a personal access token.
* Project GID: This is the specific project within the workspace in which you will create the task.
  * You can find the project(s) GID(s) by logging into Asana and then going here: https://app.asana.com/api/1.0/workspaces/WORKSPACE_GID/projects?opt_pretty
    * Where `WORKSPACE_GID` is the same as the "Workspace GID" acquired above.

## Using
* From the top folder, `npm i`
* `cd testProject`
* Modify `index.ts` as follows:
  * Change the `projectGid` property passed to the resource to match the "Project GID" acquired above.
  * Comment/uncomment the import for the "Environment Variable Credentials" or "Config Credentials" version of the dynamic provider.
* `pulumi up`
   * You should see a task created in the given project.
* If testing the token changes after creation premise described above, change the personal access token and update the `asana-access` environment with the new value.
* `pulumi destroy`
  * If using the "Environment Variable Credentials" version of the provider, it should work fine.
  * If using the "Config Credentials" version of the provider, it will fail.
    * Run `pulumi up` and then `pulumi destroy` to destroy the resource.
