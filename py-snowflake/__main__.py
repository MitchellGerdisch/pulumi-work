import pulumi
import pulumi_snowflake as snowflake
import pulumi_random as random

prod_repos = ['RAMPS', 'TRAFFICLIGHTS']
base_functions = ['RABBIT', 'DOG']
prod_functions = ['PROD_' + repo for repo in prod_repos]
prod_function_names = ['FUNCTION_' + fn for fn in prod_functions]
functions = base_functions + prod_functions

for function in functions:
    wh = snowflake.Warehouse(
        'WH_'+function
        , comment = 'Primary warehouse for the ' + function + ' function'
        , auto_resume = True
        , auto_suspend = 60
        , initially_suspended = True
        # , max_cluster_count = 2
        # , max_concurrency_level = 8
        , name = 'WH_'+function
        , statement_timeout_in_seconds = 300
        , warehouse_size = 'xsmall'
        # , opts = pulumi.ResourceOptions(provider = sysadmin)
    )

    role_name = f"FUNCTION_{function}"
    fn_role = snowflake.Role(
        role_name
        , comment = 'Functional role for ' + function
        , name = role_name
        # , opts = pulumi.ResourceOptions(provider = securityadmin)
    )
    # If this is a prod role, add the DOG team to it.
    # Worth exploring this part of the use-case a bit more.
    if (role_name in prod_function_names):
      snowflake.RoleGrants(
            'DOG_'+function+'_ROLE_GRANT'
            , role_name = f"FUNCTION_{function}"
            , roles = ['FUNCTION_DOG']
            # , opts = pulumi.ResourceOptions(provider = securityadmin)
            , opts = pulumi.ResourceOptions(depends_on=[fn_role])
        ) 

    wh_grant = snowflake.WarehouseGrant(
        function + '_WH_GRANT'
        , privilege = 'USAGE'
        , roles = ['FUNCTION_'+function]
        , warehouse_name = wh.name
        , with_grant_option = False
        # , opts = pulumi.ResourceOptions(provider = securityadmin)
    )

# for function in prod_function_names:
#     snowflake.RoleGrants(
#             'DOG_'+function+'_ROLE_GRANT'
#             , role_name = f"FUNCTION_{function}"
#             , roles = ['FUNCTION_DOG']
#             # , opts = pulumi.ResourceOptions(provider = securityadmin)
#             , opts = pulumi.ResourceOptions(depends_on=[])
#         )

def setup_user (username, function):
    user_password = random.RandomPassword(f"{username}-password",
      length=8,
      min_numeric=1,
      min_special=1,
      min_upper=1,
      min_lower=1
    ).result  

    user = snowflake.User(username,
      name=username,
      comment="test user for "+username,
      # default_role="SYSADMIN",
      # default_secondary_roles=["ALL"],
      # default_warehouse="warehouse",
      disabled=False,
      display_name=username,
      email=f"mitch-{username}@pulumi.com",
      first_name="mitch",
      last_name=username,
      login_name=username,
      must_change_password=True,
      password=user_password,
    )
    user_role = snowflake.Role(
        'USER_'+username
        , comment = 'User role for ' + username
        , name = 'USER_'+username
        # , opts = pulumi.ResourceOptions(provider = securityadmin)
        )

    snowflake.RoleGrants(
        username + '_USER_ROLE_GRANT'
        , role_name = user_role.name
        , users = [user.name]
        # , opts = pulumi.ResourceOptions(provider = securityadmin)
    )

    snowflake.RoleGrants(
      username + '_FUNCTION_ROLE_GRANT'
      , role_name = 'FUNCTION_'+function
      , roles = [user_role.name]
      # , opts = pulumi.ResourceOptions(provider = securityadmin)
    )
 

setup_user('MITCH', 'RABBIT')
setup_user('MITCH_DOG', 'DOG')
# setup_user('PROD_RAMPS', 'PROD_RAMPS')
# setup_user('PROD_TRAFFICLIGHTS', 'PROD_TRAFFICLIGHTS')




# sf_config = pulumi.Config("snowflake")
# securityadmin = snowflake.Provider(
#     'SECURITYADMIN',
#     role = 'SECURITYADMIN',
#     account = sf_config.require("account"),
#     Xregion = sf_config.require("region"),
#     username = sf_config.require("username"),
#     password = sf_config.require("password"),
#     )

# sysadmin = snowflake.Provider(
#     'SYSADMIN',
#     role = 'SYSADMIN',
#     account = sf_config.require("account"),
#     Xregion = sf_config.require("region"),
#     username = sf_config.require("username"),
#     password = sf_config.require("password"),
#     )



 

