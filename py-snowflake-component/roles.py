from pulumi import ComponentResource, ResourceOptions
import pulumi_snowflake as snowflake

class FlakeyRolesArgs:

    def __init__(self,
                  username
                 ):
      self.username = username


class FlakeyRoles(ComponentResource):

    def __init__(self,
                 name: str,
                 args: FlakeyRolesArgs,
                 opts: ResourceOptions = None):

        super().__init__('custom:resource:FlakeyRoles', name, {}, opts)

        prefix = (name+"_")

        self.rolename=(prefix+"TEST_ROLE")
        self.test_role = snowflake.Role("test-role", 
          name=self.rolename,
          opts=ResourceOptions(parent=self)
        )

        self.rolename1=(prefix+"OTHER_ROLE_1")
        self.other_role_1 = snowflake.Role("other-role-1", 
          name=self.rolename1,
          opts=ResourceOptions(parent=self)
        )

        self.rolename2=(prefix +"OTHER_ROLE_2")
        self.other_role_2 = snowflake.Role("other-role-2", 
          name=self.rolename2,
          opts=ResourceOptions(parent=self)
        )

        self.rolegrant = snowflake.RoleGrants("test-role-grant",
          role_name=self.test_role.name,
          # roles=[self.rolename1],
          roles=[self.rolename1, self.rolename2],
          users=[args.username],
          opts=ResourceOptions(parent=self)
        )

        self.register_outputs({})
