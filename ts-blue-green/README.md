# Pulumi blue-green exercise

The premise is as follows:
* There is a blue backend and a green backend.
* There is a single cloud front distribution that points at one of the backends (the active backend).
* There is a Route 53 DNS record that points at the cloud front distribution.
* The stack config file identifies the currently active backend.
* Do a `pulumi up` after changing the active backend setting in the stack config and this updates the cloud front distribution with the now active backend.

## Variant 1
In this model, there is a single cloudfront distribution that is updated to point at the blue or green backend.
Although this process takes a solid 4 minutes, as long as the distribution TTL is set to, say, 5 minutes, there is no interruption in serving the site.

# Variant 2
In this model, there are two cloudfront distributions and the DNS is updated to point at the applicable distribution.  

HOWEVER, this runs into an AWS-inflicted issue:
* To support the DNS front-end, a distribution needs to be configured with an `alias` property that contains the DNS name.
* AWS does not allow two distributions to alias the same domain name at the same time. 

And switching the alias at `pulumi up` does not work since the previously active distribution needs to have the alias removed before it can be added to the now active distribution. Although this can be managed in Pulumi by managing `dependsOn`, it means that for the time the previously active and new active distributions are updates (about 8 minutes) the site is down.

But, there is a hack that can be used to work around the `alias` limitation and that is to use `*.domainname` for one distribution's alias and the actual fqdn for the other. This allows DNS routing to work.
This is implemented in the code by specifying stack config for dual-distributions.

## Variant 3 (NOT IMPLEMENTED)
Another option could be to front things with a load balancer in front of two distributions.
This is untested, but the idea is that `pulumi up` updates the target for a load balancer to switch between the blue or green distribution. Could even be done with some partial balancing on the first `pulumi up` and then switch completely over to the appropriate backend on another `pulumi up`

## Caveats
It is best to destroy the stack before switching the variant setting.
It may work without doing so, but it has not been tested.