# What is this

This folder contains a contrived example showing

- Getting stack reference outputs
- Using those outputs for a get function
- Using the result of that get function for inputs to resource creation

# To Use

- cd base_stack
- pulumi stack init
- npm install
- pulumi up
  - This will create a GCP bucket and object
- cd ../other_stack
- pulumi stack init
- npm install
- pulumi config set stackName <STACK NAME CREATED BY THE BASE_STACK>
- pulumi up
  - This will read outputs from base_stack and create a new object in the same bucket created by base_stack
