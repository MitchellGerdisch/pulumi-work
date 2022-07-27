# An Exercise In Creating an NPM Package Based On a Pulumi Component Resource
This folder contains the bits and baubles to create an NPM package from a Pulumi Component Resource and that can then be published to an Azure DevOps Artifacts feed.

# Basic Set Up Steps
In a nutshell if you follow the steps specified by Azure DevOps Artifacts when you click `Connect to Feed` you'll set things up correctly. But here are some items of note:
* In Azure DevOps/Artifacts, click on `Create Feed` to create a new feed.
  * You can use the default settings
* To publish a package, click on `Connect to Feed` and then follow the steps given to set things up.
  * The `user .npmrc` is simply an `.npmrc` that is under your HOME directory and just copy what they say to do and go through the steps to add your token.

# Modifying, Building, Publishing the Package
* From the `storage-infra-pkg` folder you can modify the Pulumi code and then run these commands:
  * `npm i`
  * `npm run build`
  * `npm run lint`
  * `npm publish`

NOTE: all the settings files in the `storage-infra-pkg` folder are important and set things up so the above steps work and so that the later `pulumi up` works.

# Using the Package
* Besure the Pulumi project folder has a `.npmrc` as per the `Connect to Feed` instructions
* `npm i storage-infra-pkg@X.X.X` (where X.X.X is the version in Artifacts) to install the package.
* See the code for how it is referenced.