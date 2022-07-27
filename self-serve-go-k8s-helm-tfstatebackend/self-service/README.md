# Super Basic Self-Service Automation
Uses automation API to allow for command line orchestration of a couple of stacks.

This is also plugged into a super simple web form to request the stacks.

# Set Up
* Open a terminal and navigate to the `self-service` folder.
* `export PULUMI_ACCESS_TOKEN=pul-dsfdsfdsfds`

# How to Run
NOTE: Defaults to run in `demo` Pulumi organization

## Manual Run
* `go run main.go -stack STACKNAME`

## Web
* `go run server.go`
* Point browser at `http://localhost:8080`
* Enter a string which will be used for the stack name and hit submit.