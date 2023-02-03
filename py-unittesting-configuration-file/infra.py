import pulumi
from pulumi_random import RandomId
from pulumi_gcp import storage

### infra for running tests that show how config can be used when testing
config = pulumi.Config()
byte_length = config.require_int("byte_length") or 6
rando = RandomId("rando",
  byte_length=byte_length
  )


### infra for additional unit tests
org = pulumi.get_organization()
project = pulumi.get_project()
my_bucket = storage.Bucket(f"{org}-{project}-bucket".lower(),
    force_destroy=True,
    lifecycle_rules=[
        storage.BucketLifecycleRuleArgs(
            action=storage.BucketLifecycleRuleActionArgs(
                type="Delete",
            ),
            condition=storage.BucketLifecycleRuleConditionArgs(
                age=3,
            ),
        ),
        storage.BucketLifecycleRuleArgs(
            action=storage.BucketLifecycleRuleActionArgs(
                type="AbortIncompleteMultipartUpload",
            ),
            condition=storage.BucketLifecycleRuleConditionArgs(
                age=1,
            ),
        ),
    ],
    location="US")
