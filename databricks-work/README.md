# databricks-work
Two projects:
- One sets up a workspace in Azure
- The other builds a notebook and job in that workspace

# Demo notes
- To access the workspace, go to Azure workspace resource and click on it's URL from there. 
  - It may take a couple of tries or minutes to get access to the workspace UI.
- Then when you run the notebook stack, you'll see it added to the workspace.

# Prereqs
Create an environment that looks like:
```
values:
  stack-outputs:
    fn::open::pulumi-stacks:
      stacks:
        databricksBase:
          stack: databricks-base-workspace/dev
  pulumiConfig:
    databricks:host: ${stack-outputs.databricksBase.workspace_url}
```

This is used by the notebook stack to setup the databricks provider for creating the notebook and job.