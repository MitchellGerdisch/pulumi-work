import pulumi
import pulumi_azure as azure

name = "mitch"
example_resource_group = azure.core.ResourceGroup(name+"ResourceGroup", name=name+"-rg",location="East US")

## SDK versions pulumi_azure: v3.15.0; pulumi: v2.5.0
example_action_group = azure.monitoring.ActionGroup(name+"ActionGroup",
    name=name+"-ag",
    resource_group_name=example_resource_group.name,
    short_name="p0action",
    webhook_receivers=[{ 
        "name": "callmyapiaswell",
        "service_uri": "http://example.com/alert",
        "use_common_alert_schema": False,
    }])

## Current sdk version
# example_action_group = azure.monitoring.ActionGroup(name+"ActionGroup",
#     resource_group_name=example_resource_group.name,
#     short_name="p0action",
#     webhook_receivers=[azure.monitoring.ActionGroupWebhookReceiverArgs(
#         name="callmyapiaswell",
#         service_uri="http://example.com/alert",
#         use_common_alert_schema=False,
#     )])

pulumi.export('resource_group', example_resource_group)
pulumi.export('action_group', example_action_group)

