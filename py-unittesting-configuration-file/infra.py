import pulumi
from pulumi_random import RandomId

config = pulumi.Config()
byte_length = config.require_int("byte_length") or 6

rando = RandomId("rando",
  byte_length=byte_length
  )
