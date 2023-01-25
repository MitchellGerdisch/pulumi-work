# Search for Resources under Pulumi Management
Running the command will use the Pulumi service API to gather stack and resource mapping that can be searched.

# How to Use
* Build for your platform
  * env GOOS=darwin GOARCH=amd64 go build ./pulumi-resource-search.go
  * env GOOS=windows GOARCH=amd64 go build ./pulumi-resource-search.go
* From a Mac that has access to the Pulumi service, run `pulumi-resource-search -h` for command parameters.
* From a Windows machine that has access to the Pulumi service, run `pulumi-resource-search.exe -h` for command parameters.

## Examples
```
pulumi-resource-search -access_token $PULUMI_ACCESS_TOKEN -orgs "AcmeOrg" -id bucket-f3dfdsg

pulumi-resource-search -access_token $PULUMI_ACCESS_TOKEN -orgs "JohnSmith,AcmeOrg" -id /subscriptions/xxxx-xxxx-xxxx-xxxx/resourceGroups/myresourcegroup
```

# Output
* The fully qualified stackname that the resource belongs to.

# TODOs
* Generate a CSV of all the stacks resource Ids that can then be used for searching.

# Build Notes
