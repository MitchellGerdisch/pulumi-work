"""An AWS Python Pulumi program"""

import pulumi
from pulumi_aws import s3
from dynamic_resource import AclResource,ResourceInputs

acl = AclResource("my-acl", args=ResourceInputs(acl_source="public", acl_level="read-write"))
bucket = s3.Bucket('my-bucket',
  acl=acl.acl
  )

pulumi.export("acl",acl)
pulumi.export("s3_bucket", bucket)



