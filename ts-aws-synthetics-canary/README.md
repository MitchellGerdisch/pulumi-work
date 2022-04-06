Putting together an example that deploys a local canary script to AWS synthetics.

Creates S3 for holding the script
Zips the script folder and pushes it to S3
Creates canary referencing the S3

To-dos: 
- USE aws-native?
- Need to fix the canary's roles to allow it to write the results to the results S3 bucket that is created.
- something needs to be done so the lambda deleted when the canary is deleted?
- Use the undeprecated S3 stuff (see errors when doing pulumi up)
- Need to enable and disable the synthetic before using.

This example does a simple test of a website. So need to add a config variable for the destination and then sed the script? Or just use something google.com?