import unittest
import pulumi

class MyMocks(pulumi.runtime.Mocks):
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        return [args.name + '_id', args.inputs]
    def call(self, args: pulumi.runtime.MockCallArgs):
        return {}

pulumi.runtime.set_mocks(MyMocks())

import infra

required_byte_length = 8

class TestingWithMocks(unittest.TestCase):
  @pulumi.runtime.test
  def test_random_props(self):
    def check_byte_length(args):
      urn, byte_length = args
      self.assertGreaterEqual(byte_length, required_byte_length, f"random {urn} byte_length must be greater than {required_byte_length}")
    return pulumi.Output.all(infra.rando.urn, infra.rando.byte_length).apply(check_byte_length)