# AWS IAM Policies
This directory contains code related to writing Pulumi Policies that can check AWS IAM roles and policies.
It includes a test project that creates some IAM resources and a policy pack to run against the project.

See https://www.pulumi.com/docs/cli/commands/pulumi_policy_publish/ for more information about Pulumi Policy as Code.

## Set up the local policy pack 
This sets up the policy pack for local use.

NOTE: if you have a Biz Critical license, you can publish the policy pack to your Pulumi Org.
See: https://www.pulumi.com/docs/cli/commands/pulumi_policy_publish/


```bash
cd iam-policy-pack
python3 -m venv venv
source ./venv/bin/activate
pip install -r requirements.txt
```

## Run the Pulumi code using the policy pack.
This assumes you are using the local policy pack:
```bash
cd ../iam-test-project
pulumi up --policy-pack ../iam-policy-pack
```

NOTE: the policies are all written as mandatory and so will prevent the stack from being deployed.
You can modify the enforcement level in the policy pack code (or in the Pulumi UI if you published the policy - see note above).

If you published the policy pack to your org and put it in the default policy group or a policy group to which the stack is assigned, you do not need to use the `--policy-pack`.  
Just running `pulumi up` will apply the policy pack  