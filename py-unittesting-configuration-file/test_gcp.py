import unittest
import pulumi

class MyMocks(pulumi.runtime.Mocks):
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        return [args.name + '_id', args.inputs]
    def call(self, args: pulumi.runtime.MockCallArgs):
        return {}

pulumi.runtime.set_mocks(MyMocks())

import infra


class TestingWithMocks(unittest.TestCase):
  @pulumi.runtime.test
  # Test the location for the bucket.
  # To see a failure, either change required_location above or the location for the bucket in infra.py.
  def test_bucket_location(self):
    required_location = "US"
    def check_bucket_location(args):
      urn, location = args
      self.assertEqual(location, required_location, f"bucket {urn} must be in location {required_location}")
    return pulumi.Output.all(infra.my_bucket.urn, infra.my_bucket.location).apply(check_bucket_location)
  
  @pulumi.runtime.test
  # Test the lifecycle rules. 
  # To see a failure, change infra.py so bucket Delete age is less than 3, 
  # or the AbortIncompleteMultipartUpload rule age is anything other than 1.
  def test_bucket_lifecycle_rules(self): 
    min_bucket_delete_age = 3
    min_bucket_abortupload_age = 1
    def check_bucket_lifecycle_rules(args):
      urn, lifecycle_rules = args
      for rule in lifecycle_rules:
        if rule["action"]["type"] == "Delete":
          self.assertGreaterEqual(rule["condition"]["age"], min_bucket_delete_age, f"bucket {urn} DELETE rule must have an age of at least {min_bucket_delete_age}.")
        if rule["action"]["type"] == "AbortIncompleteMultipartUpload":
          self.assertEqual(rule["condition"]["age"], min_bucket_abortupload_age, f"bucket {urn} ABORT_UPLOAD rule must have an age of {min_bucket_abortupload_age}.")
    return pulumi.Output.all(infra.my_bucket.urn, infra.my_bucket.lifecycle_rules).apply(check_bucket_lifecycle_rules)