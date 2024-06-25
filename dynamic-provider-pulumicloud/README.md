# dynamic-provider-pulumicloud

This folder contains dynamic providers written in javascript, typescript and python that show how to use environment variables for credentials so as to avoid storing the (encrypted) credentials in state. This means `pulumi destroy` can run after changing the credentials without having to run `pulumi up` first to refresh the credentials in state.

The example dynamic provider uses the Pulumi Cloud REST API to manage the creation/deletion of an ESC environment in a given Pulumi org. 

NOTE: This dynamic provider is not necessary since the Pulumi Cloud SDK supports managing environments already. 

