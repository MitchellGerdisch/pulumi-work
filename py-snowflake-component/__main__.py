"""A Python Pulumi program"""

import pulumi
import pulumi_snowflake as snowflake
import roles

config = pulumi.Config()
user_password = config.require_secret("user_password")

user = snowflake.User("test-user", 
  name="TEST_USER",
  password=user_password,
)

flakey_role = roles.FlakeyRoles("PROD", roles.FlakeyRolesArgs(
    username=user.name
))

# rolename="TEST_ROLE"
# test_role = snowflake.Role("test-role", 
#   name=rolename
# )

# rolename1="OTHER_ROLE_1"
# other_role_1 = snowflake.Role("other-role-1", 
#   name=rolename1
# )

# rolename2=None
# prefix = "PROD_"
# rolename2=(prefix +"OTHER_ROLE_2")
# other_role_2 = snowflake.Role("other-role-2", 
#   name=rolename2
# )

# rolegrant = snowflake.RoleGrants("test-role-grant",
#   role_name=test_role.name,
#   roles=[rolename1, rolename2],
#   users=[user.name]
# )



# # pulumi.export("user_name", user.name)
# # pulumi.export("user_password", user.password)
# # # pulumi.export("rolegrant something", f"my rolename is: {rolegrant.role_name}")
# # pulumi.export("stuff", pulumi.Output.concat("my rolename is: ",rolegrant.role_name))
# # pulumi.export("rolegrant something2", rolegrant.users)

# myoutputstring = rolegrant.role_name.apply(lambda rolename:  f"my stuff is: {rolename}")
# pulumi.export("myoutputstring", myoutputstring)









