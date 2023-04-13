# Counts Pulumi Resources Under Management
Running the command will use the Pulumi service API to gather RUM counts for the projects and stacks in a given Pulumi organization.

# How to Use
* From a Mac that has access to the Pulumi service, run `pulumi-rum-counter -h` for command parameters.
* From a Windows machine that has access to the Pulumi service, run `pulumi-rum-counter.exe -h` for command parameters.

## Usage
```bash
Usage of ./pulumi-rum-counter:
  -access_token string
        Pulumi access token with access to specified Organization
  -csv
        Flag to indicate if output should be in CSV format.
  -org string
        Pulumi organization from which to gather resource counts.
  -service_host string
        Pulumi service host name or IP. E.g. pulumi.com. Defaults to pulumi.com
```

# Output
The tool will output total RUM as well as project-level and stack-level RUM data.
