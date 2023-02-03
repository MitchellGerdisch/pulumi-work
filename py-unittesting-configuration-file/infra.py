import pulumi
from pulumi_random import RandomId
from pulumi_gcp import storage

# Get the config
config = pulumi.Config()

### infra for running tests that show how config can be used when testing
byte_length = config.require_int("byte_length") or 6
rando = RandomId("rando",
  byte_length=byte_length
  )


### infra for additional unit tests
org = pulumi.get_organization()
project = pulumi.get_project()
delete_age = config.get("delete_age") or 3
abort_age = config.get("abort_age") or 1

my_bucket = storage.Bucket(f"{org}-{project}-bucket".lower(),
    force_destroy=True,
    lifecycle_rules=[
        storage.BucketLifecycleRuleArgs(
            action=storage.BucketLifecycleRuleActionArgs(
                type="Delete",
            ),
            condition=storage.BucketLifecycleRuleConditionArgs(
                age=delete_age,
            ),
        ),
        storage.BucketLifecycleRuleArgs(
            action=storage.BucketLifecycleRuleActionArgs(
                type="AbortIncompleteMultipartUpload",
            ),
            condition=storage.BucketLifecycleRuleConditionArgs(
                age=abort_age,
            ),
        ),
    ],
    location="US")
