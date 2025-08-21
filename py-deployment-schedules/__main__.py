import pulumi
import pulumi_pulumiservice as ps
from pulumi_command import local
from mitchellgerdisch_pcloudsettings import Schedules, SchedulesArgs

org = pulumi.get_organization()
project = pulumi.get_project()
stack = pulumi.get_stack()

git_origin_cmd = local.Command(
    "git_origin",
    create="git config --get remote.origin.url"
)
git_origin = git_origin_cmd.stdout

deployment_settings = ps.DeploymentSettings(
    "deploymentSettings",
    organization=org,
    project=project,
    stack=stack,
    source_context={
        "git": {
            "branch": "master",
            "repoUrl": git_origin,
            "repoDir": "py-deployment-schedules"
        }
    }
)

schedules = Schedules(
    "schedules",
    organization=org,
    project=project,
    stack=stack,
    ttl_minutes=1440,
    opts=pulumi.ResourceOptions(depends_on=[deployment_settings])
)   

# Manage stack settings using the centrally managed custom component.
# stackmgmt = StackSettings("stacksettings") 

# ttl_schedule = ps.TtlSchedule(
#     "ttlSchedule",
#     organization=org,
#     project=project,
#     stack=stack,
#     timestamp="2028-03-26T22:05:00Z",
#     delete_after_destroy=True,
#     opts=pulumi.ResourceOptions(depends_on=[deployment_settings])
# )
