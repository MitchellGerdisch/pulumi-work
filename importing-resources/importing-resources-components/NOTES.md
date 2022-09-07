# Importing into Components Options

## Method 0: Import into a one-off project/stack
The idea here is to just accept the technical debt of existing infra and use `pulumi import` to get the infra imported and code
generated and just use the generated code as-is.
So you basically end up with a unique project and single stack for each imported environment (however you want to define "environment").
And you just manage that stuff in that special project/stack.
If there is a major update that is needed then look at doing a blue-green type of fresh deploy using you more generalized Pulumi code that is being used for new environments.
Unless there are bunches and bunches of existing environments this is in some ways the easiest and cleanest.

## Method 1: Import to stack and then alias to component resource
The idea here is to import into "generic" project and component resource code that may be used for green field deployments.  
The main thing is that the component resource needs to account for all the properties returned from the import.  
And you need a way to pass in the alias URN info to the component resource.  
The approach shown here is just adding optional alias properties to the component resource properties.  
A more clever approach may be to use stack transformation ....
### Method 1a: Import to stack and alias to component resource using component resource alias properties
* `pulumi up` to create "blank" stack
* `pulumi import` like normal
* Copy code to main project and 
  * do `pulumi preview` to confirm all is stable
* Change to component resource instantiation in main project by passing component resource's rgAlias and vnetAlias properties
  * This is a bit of an attempt to avoid having to modify the component resource itself to add the alias resource option 
  * do `pulumi preview` to confirm all is stable
* Do `pulumi up` to make the state change for the alias
* Remove the alias component properties in index.ts
* Do `pulumi up` to confirm no change other than state update

### Method 1b: Import to stak and alias to component resource usng stack transforms.
TBD NOT sure if doable.

## Method 2: Import directly to component resource
**DO NOT LIKE THIS APPROACH**
You have to create an empty component resource and then import into it.
But the resource name is goofy and you need to alias around that ...
I think method 1 using transforms is the way to go.

This approach requires instantiating the component resource. 
So if using an existing component resource that means instantiating the resources in the component resource and then ADDING the imported resource. 
Or it means using an shell of a component resource to import into.
* `pulumi import ... parent=<component resource urn>` to import the resource into the component resource