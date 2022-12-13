# Simple Stack
Super simple stack to show a pulumi deployment example.

# Project and Depoyments Layout.
There are two stacks set up in Pulumi that map to given branches:
* dev stack => dev branch
* prod stack => main branch

# Demos
## Deploy from Pulumi UI
* Select stack of interest.
* Select the `Actions` pull down and run a given deployment.
* See the deployment in the UI.

## Git Push to Deploy
* Push a change in the `simple-stack` folder to one of the branches noted above.
* See the deployment action in the Pulumi UI.

## PR to Deploy
* Push a change in the `simple-stack` folder to one of the non-main branches noted above. Or to a new branch.
* Create a PR against one of the branches noted above.
* See the deployment action in the Pulumi UI.
* This can then be followed by merging the PR and seeing the deployment against the merged-to branch.

