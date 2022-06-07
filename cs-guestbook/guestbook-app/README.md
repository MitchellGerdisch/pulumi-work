# Introduction
Deploys Guestbook app and related containers on an EKS cluster deployed via another stack.

# Setup
- `pulumi config set aws:region us-west-2`  
  Recommend not using us-east-2 since there's something wonky about that environment when it comes to setting up the public IP for the service. (TODO: Figure out what's wonky there.)
- `pulumi config set org ORGANIZATION`
  - Where *ORGANIZATION* is the name of the org in which the EKS is launched.
- `pulumi config set eksProject guestbook-base-eks-infra-cs`

# Launch and Use
## Prepare the GuestBook Service Project
The `guestbook-app` uses the C# `pulumi_k8s_servicedeployment` package sdk generated in the multilanguage-packages folder. Therefore you need to set up your environment to be able to use it. The SDK is automatically installed via the `nuget.config` and `.csproj` files.
However the plugin needs to be installed for the SDK to work.

- Find the `demos/multilanguage-packages/pulumi-k8s-servicedeployment/bin` directory
  - Look at the gzip tarballs in there and note the path to the one for your machine.
  - If you don't see a tarball for your machine, see the `gen_provider_plugin` target in `Makefile` for the package.
- run `dotnet list package` to see the version of the `pulumi-k8s-servicedeployment` sdk and note the VERSION
- Install the package's plugin:
  ```bash
  pulumi plugin install resource k8s-servicedeployment v0.0.3 -f PACKAGE_TARBALL_NOTED_ABOVE
  ```
  NOTE: use the VERSION retrieved from the `pip list` above. 

- OPTIONALLY: Instead of installing the plugin, you can do the following in a terminal window opened int the `demos/aws-cs-eks-guestbook/guestbook-app` directory:
  - `export PATH=$PATH:<PKG_DIR>/bin`
    - Where <PKG_DIR> is the path to the `pulumi-k8s-servicedeployment` package noted above
    - This is done so the pulumi engine can find the package binary (aka plugin).

- SHOULD NOT BE NEEDED. The `nuget.config` and `.csproj` files set up the SDK automatically. But if something gets wonky you can install the dotnet sdk: 
  `dotnet add package --source "<PKG_DIR>/nuget;https://api.nuget.org/v3/index.json"  Pulumi.K8sServiceDeployment`
  - Where <PKG_DIR> is the path to the `K8sServiceDeployment` package noted above.
  - This installs the generated dotnet SDK.

## Lauch the GuestBook Stack
The GuestBook stack launches quickly.   
**NOTE** the Guestbook app itself takes about a minute to come up.