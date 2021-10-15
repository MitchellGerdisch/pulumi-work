"""An Azure Python Pulumi program"""

import pulumi
import pulumi_azure as azure
import os

subscription = os.environ['SUBSCRIPTION_ID']

rgname='mitch-rg'
agname='mitch-ag'
name = "mitchimp"
import_resource_group = azure.core.ResourceGroup(name+"ResourceGroup", location="East US",
  name=rgname,
  opts=pulumi.ResourceOptions(import_='/subscriptions/'+subscription+'/resourceGroups/'+rgname)
)


## SDKs: pulumi-azure: v3.15.0; pulumi: v2.5.0
import_action_group = azure.monitoring.ActionGroup(name+"ActionGroup",
    name=agname,
    resource_group_name=import_resource_group.name,
    short_name="p0action",
    webhook_receivers=[{ 
        "name": "callmyapiaswell",
        "service_uri": "http://example.com/alert",
        "use_common_alert_schema": False,
    }],
    opts=pulumi.ResourceOptions(import_='/subscriptions/'+subscription+'/resourceGroups/'+rgname+'/providers/microsoft.insights/actionGroups/'+agname)
    ### fails due to incorrect upper/lower case: opts=pulumi.ResourceOptions(import_='/subscriptions/'+subscription+'/resourcegroups/'+rgname+'/providers/Microsoft.Insights/actiongroups/'+agname)
)

## Current SDK 
# import_action_group = azure.monitoring.ActionGroup(name+"ActionGroup",
#     name=agname,
#     resource_group_name=import_resource_group.name,
#     short_name="p0action",
#     webhook_receivers=[azure.monitoring.ActionGroupWebhookReceiverArgs(
#         name="callmyapiaswell",
#         service_uri="http://example.com/alert",
#         use_common_alert_schema=False,
#     )],

#     opts=pulumi.ResourceOptions(import_='/subscriptions/'+subscription+'/resourceGroups/'+rgname+'/providers/microsoft.insights/actionGroups/'+agname)
# )

