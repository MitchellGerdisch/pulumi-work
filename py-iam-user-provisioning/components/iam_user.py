from pulumi import ComponentResource, ResourceOptions
from pulumi_aws import iam


class IamUserArgs:

    def __init__(self,
                 user_name="user",
                 user_path=None,
                 user_policy=None,
                 ):

        self.user_path=user_path
        self.user_policy=user_policy
        self.user_name=user_name


class IamUser(ComponentResource):

    def __init__(self,
                 name: str,
                 args: IamUserArgs,
                 opts: ResourceOptions = None):

        super().__init__('custom:resource:IamUser', name, None, opts)

        iam_user = iam.User(f"{name}-iam-user", 
            name=args.user_name,
            path=args.user_path,
            force_destroy=True,
            tags={
                "Use":"Pulumi-Demo"
            },
            opts=ResourceOptions(parent=self, delete_before_replace=True))

        iam_user_profile = iam.UserLoginProfile(f"{name}-user-profile", 
            user=iam_user.name, 
            password_reset_required=True,
            opts=ResourceOptions(additional_secret_outputs=["password"], parent=self, delete_before_replace=True))

        user_access_key = iam.AccessKey(f"{name}-access-keys",
            user=iam_user.name,
            opts=ResourceOptions(parent=self))

        user_policy = iam.UserPolicy(f"{name}-user-pol",
            user=iam_user.name,
            policy=args.user_policy,
            opts=ResourceOptions(parent=self))

        self.name = iam_user.name
        self.arn = iam_user.arn
        self.access_key_id = user_access_key.id
        self.secret_access_key = user_access_key.secret
        self.password = iam_user_profile.password

        self.register_outputs({})