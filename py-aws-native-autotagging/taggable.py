# isTaggable returns true if the given resource type is an AWS resource that supports tags.
def is_taggable(t):
    return t in taggable_resource_types

# taggable_resource_types is a list of known AWS type tokens that are taggable.
# The resource type is basically the same as the class name used to instantiate the resource.
# So if you look at the VPC resource, you'll see "aws_native.ec2.VPC" and this is translated to
# "aws-native:ec2:VPC".
# The list of "taggable" resources from the original (aws-classic based) blog can be found here:
# https://github.com/joeduffy/aws-tags-example/blob/master/autotag-py/taggable.py
taggable_resource_types = [
   'aws-native:ec2:VPC',
   'aws-native:ec2:Subnet'
]
