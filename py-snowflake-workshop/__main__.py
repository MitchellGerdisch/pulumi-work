"""A Python Pulumi program"""

import pulumi
import pulumi_snowflake as snowflake

config = pulumi.Config()
user_password = config.require_secret("user_password")

user = snowflake.User("test-user", 
  name="TEST_USER",
  password=user_password,
)

rolename="TEST_ROLE"
role = snowflake.Role("test-role", 
  name=rolename
)

rolegrant = snowflake.RoleGrants("test-role-grant",
  role_name=role.name,
  users=[user.name]
)



# pulumi.export("user_name", user.name)
# pulumi.export("user_password", user.password)
# # pulumi.export("rolegrant something", f"my rolename is: {rolegrant.role_name}")
# pulumi.export("stuff", pulumi.Output.concat("my rolename is: ",rolegrant.role_name))
# pulumi.export("rolegrant something2", rolegrant.users)

myoutputstring = rolegrant.role_name.apply(lambda rolename:  f"my stuff is: {rolename}")
pulumi.export("myoutputstring", myoutputstring)









