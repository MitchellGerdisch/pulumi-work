# isTaggable returns true if the given resource type is an AWS resource that supports tags.
def is_taggable(t):
    return t in taggable_resource_types

# taggable_resource_types is a list of known AWS type tokens that are taggable.
taggable_resource_types = [
   'aws-native:ec2:VPC' 
]
