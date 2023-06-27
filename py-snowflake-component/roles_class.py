import pulumi
import pulumi_snowflake as snowflake
from pulumi import ResourceOptions


class Roles:
    def __init__(self, prefix):
        self.account_prefix = prefix
        
        self.main_role_name =(prefix+"MAIN_ROLE")

        self.accountadmin_name = "ACCOUNTADMIN"

        self.account_mitch_data_private_writer_role_name = (
            prefix + "MITCH_DATA_PRIVATE_WRITER_ROLE"
        )
        self._add_roles()

    def _add_roles(self):

        snowflake.Role(self.main_role_name,
          name=self.main_role_name,
          opts=ResourceOptions(protect=False)
        )

        snowflake.Role(
            self.account_mitch_data_private_writer_role_name,
            name=self.account_mitch_data_private_writer_role_name,
            opts=pulumi.ResourceOptions(protect=False),
        )

        snowflake.RoleGrants(
            f"{self.account_prefix}DB_PRIVATE_WRITER_ROLE - grant",
            roles=[
                self.accountadmin_name,
                self.account_mitch_data_private_writer_role_name,
            ],
            role_name=self.main_role_name,
            opts=pulumi.ResourceOptions(protect=False),
        )
