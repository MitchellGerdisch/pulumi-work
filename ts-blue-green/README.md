# Pulumi blue-green exercise

The premise is as follows:
* There is a blue backend and a green backend.
* There is a single cloud front distribution that points at one of the backends (the active backend).
* There is a Route 53 DNS record that points at the cloud front distribution.
* The stack config file identifies the currently active backend.
* Do a `pulumi up` after changing the active backend setting in the stack config and this updates the cloud front distribution with the now active backend.

## Possible Improvements
The update takes a solid 4 minutes to complete.
For speedier performance, I would like to have two cloud fronts and then just flip the route 53 record, but only one cloud front can own the Route 53 alias. So I would still have to update the cloud front configs for each distribution (remove it from old; add it to new).
That said, updating the aliases may be speedier.