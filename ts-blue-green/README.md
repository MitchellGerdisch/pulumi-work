# Pulumi blue-green exercise

The premise is as follows:
* There is a blue backend and a green backend.
* There is a single cloud front distribution that points at one of the backends (the active backend).
* There is a Route 53 DNS record that points at the cloud front distribution.
* The stack config file identifies the currently active backend.
* Do a `pulumi up` after changing the active backend setting in the stack config and this updates the cloud front distribution with the now active backend.

## Possible Improvements
The update takes a solid 4 minutes to complete.
For speedier performance, I would like to have two cloud fronts and then just flip the route 53 record, but only one cloud front can own the Route 53 alias. 
There is a version that tries to implement this approach on a branch named `blue-green-mkII` but it has some AWS-inflicted issues.
I think a better approach would be to put stuff behind a load balancer.