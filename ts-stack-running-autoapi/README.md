# ts-stack-running-autoapi
This was a small experiment to investigate ways to run a Pulumi automation API program from a Pulumi stack.

This experiment was initiated by thoughts around using Pulumi Deployments to run automation API to do things like automatically destroy stacks or stuff like that.
A variation on this theme would then be to have some cron job periodically call the Pulumi deployments API to run the given deployment. See section below for hints on how one can use the Deployments API.

Since Deployments currently only runs Pulumi stacks, this meant coming up with a way for a Pulumi stack to run automation API.
It uses the Pulumi Command provider to run the automation API code.
It also "tricks" the Command resource to run on every update.

## Deployments API
```
const url = `https://api.pulumi.com/api/stacks/${organization}/${project}/${stack}/deployments`
const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `token ${stackConfig.pulumiAccessToken.get()}` // or some mechanism to get a token to authenticate to pulumi with
};
const payload = {
    inheritSettings: true,
    operation: "update", // Or "destroy" or "refresh" or "preview"
}

await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
});

```