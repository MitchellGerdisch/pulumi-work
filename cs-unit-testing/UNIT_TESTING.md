# Notes
The main goals here are:
* Show a way to test component resources.
  * In this case the idea is to make sure the component resource, itself, abides by some requirements 
    * e.g. the storage account `kind` property is set to "StorageV2" by the component

## Key Learnings
* See Links below, but set up the directory structure in accordance with C# unit testing practices.
* In the Tests folder I created a shim pulumi project to call my component resource.
  * Could use a single stack as such for multiple component resources.
  * But I'm thinking it makes sense to create one for each component resource and colocate all this stuff.
* I had to make the component resource classes `public` to allow the test folder stuff to see/run them.
  * I suspect there may be a better c#-way to accomplish this.

## Main Components of the Environment
### Testing.cs
* Where mocks are made
* You can add outputs to resources here. 
  * NOTE: in my goal to test the component resource, I DO NOT want to add outputs for the component resource here, but rather for the base resources (e.g. StorageAccount) that the component resource uses. 
  * If you look at Testing.cs, you'll see I add the Name output to StorageAccount types so that the StorageInfra resource has something to return and my test has something to see if it is set or not by the component resource.
    * NOTE that the outputs are added in camelCase and not CamelCase even though C# expects properties with uppercase first letter.

### StorageInfraTests.cs
* This is where the tests are written and assertions made.

### StorageInfraTestStack.cs
* This is a thin stack that runs my StorageInfra component resource

## Useful Links
* Based on https://www.pulumi.com/docs/guides/testing/unit/ 
  * And more specifically, the repo code here: https://github.com/pulumi/examples/tree/master/testing-unit-cs 
* HOWEVER, I followed the steps here to get the basic environment setup:
  * https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-with-nunit
* ALSO, for this to work, I had to make the StorageInfra and StorageInfraArgs classes `public` as opposed to the default nothing

## Setup beyond that done as per the learn.microsoft.com steps noted above.
dotnet add package NUnit
dotnet add package NUnit3TestAdapter
dotnet add package Moq
dotnet add package FluentAssertions