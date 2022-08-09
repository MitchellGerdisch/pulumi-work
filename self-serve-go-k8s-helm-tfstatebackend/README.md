# Super Basic Self-Service Automation
Uses automation API to allow for command line orchestration of a couple of stacks.

This is also plugged into a super simple web form to request the stacks.

# Key Concepts Demonstrated
* Accessing a Terraform backend state file residing in AWS S3
  * Uses a python project for this stack.
* Stacks and stack references in Golang
* Use of the Pulumi Service provider to set Stack Tags in Python and Go
* Automation API in Golang
* Simple web front-end to the automation API code to deploy stacks.

# Set Up
## Base Terraform Infrastructure Set Up
* Open a terminal and navigate to the `base-vpc/base-vpc-tf` folder
* Run terraform to set up the TF-managed resources
  * `terraform init`
  * `terraform plan`
  * `terraform apply`

## Pulumi  
* Open a terminal and navigate to the `self-service` folder.
* `export PULUMI_ACCESS_TOKEN=pul-dsfdsfdsfds`
 * You can create an access token in the Pulumi UI under Settings.
 * This is used to set the Pulumi stack tags. 

# How to Run
NOTE: Defaults to run in `demo` Pulumi organization

## Manual Run
Basic command
* `go run main.go -stack STACKNAME`
Other Options:
* `-org PULUMI_ORG_NAME` - deploys to given Pulumi org
* `-destroy` - destroys the stacks 

## Web
* `go run server.go`
* Point browser at `http://localhost:8080/form.html`
* Enter a string which will be used for the stack name and hit submit.
* You can watch the progress from the terminal where you ran `go run server.go` or from Pulumi UI for three projects:
 * base-infra
 * go-base-eks
 * go-k8s-apps

# Clean Up
* from the `self-service` folder: `go run main.go -destroy -stack STACKNAME`
* from the `base-vpc/base-vpc-tf` folder: `terraform destroy` 
