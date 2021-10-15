from pulumi import ResourceOptions, Input, Output
from pulumi.dynamic import Resource, ResourceProvider, CreateResult
from typing import Any, Optional

class ResourceInputs(object):
  acl_source: Input[str]
  acl_level: Input[str]
  def __init__(self, acl_source, acl_level):
    self.acl_source = acl_source 
    self.acl_level = acl_level

class AclProvider(ResourceProvider):
    def create(self, args):
      return CreateResult(id_="my_acl", outs={ 'acl': args["acl_source"]+"-"+args["acl_level"] })

class AclResource(Resource):
    acl: Output[str]

    def __init__(self, name: str, args: ResourceInputs, opts: Optional[ResourceOptions] = None):
         super().__init__(AclProvider(), name, { 'acl': None, **vars(args) }, opts)