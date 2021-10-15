using Pulumi;
using AzureNextGen = Pulumi.AzureNextGen;
using Pulumi.AzureNextGen.Resources.Latest;
using Azure = Pulumi.Azure;

class MyStack : Stack
{
  public MyStack()
  {
    var baseName = "mitchDotNetCoreTest";
    var config = new Config();

    var aPPINSIGHTSPROFILERFEATUREVERSIONParam = config.Get("aPPINSIGHTSPROFILERFEATUREVERSIONParam") ?? "disabled";
    var aPPINSIGHTSSNAPSHOTFEATUREVERSIONParam = config.Get("aPPINSIGHTSSNAPSHOTFEATUREVERSIONParam") ?? "disabled";
    var appInsightExtVersionParam = config.Get("appInsightExtVersionParam") ?? "~2";
    var diagnosticServicesEXTENSIONVERSIONParam = config.Get("diagnosticServicesEXTENSIONVERSIONParam") ?? "disabled";
    var instrumentationEngineEXTENSIONVERSIONParam = config.Get("instrumentationEngineEXTENSIONVERSIONParam") ?? "disabled";

    var resourceGroupNameParam = config.Get("resourceGroupNameParam") ?? $"{baseName}-rg";
    var appNameParam = config.Get("appNameParam") ?? $"{baseName}-app";
    var hostingPlanNameParam = config.Get("hostingPlanNameParam") ?? $"{baseName}-plan";
    var appInsightNameParam = config.Get("appInsightNameParam") ?? $"{baseName}-insight";
    var appAlwaysOnParam = config.GetBoolean("appAlwaysOnParam") ?? true;
    var httpsOnlyParam = config.GetBoolean("httpsOnlyParam") ?? true;
    var skuCapacityParam = 1;
    var skuNameParam = "S1";
    var skuTierParam = "Standard";

    var snapshotDebuggerEXTENSIONVERSIONParam = config.Get("snapshotDebuggerEXTENSIONVERSIONParam") ?? "disabled";
    var xDTAppInsightModeParam = config.Get("xDTAppInsightModeParam") ?? "recommended";
    var xDTMicrosoftApplicationInsightsBaseExtensionsParam = config.Get("xDTMicrosoftApplicationInsightsBaseExtensionsParam") ?? "disabled";
    var xDTMicrosoftApplicationInsightsPreemptSdkParam = config.Get("xDTMicrosoftApplicationInsightsPreemptSdkParam") ?? "disabled";

    var resourceGroup = new ResourceGroup(resourceGroupNameParam, new ResourceGroupArgs
    {
      ResourceGroupName = resourceGroupNameParam,
      Location = "CentralUS"
    });

    var serverfarmResource = new AzureNextGen.Web.V20180201.AppServicePlan(hostingPlanNameParam, new AzureNextGen.Web.V20180201.AppServicePlanArgs
    {
      Kind = "app",
      Location = resourceGroup.Location,
      Name = hostingPlanNameParam,
      ResourceGroupName = resourceGroup.Name,
      Sku = new AzureNextGen.Web.V20180201.Inputs.SkuDescriptionArgs
      {
        Capacity = skuCapacityParam,
        Name = skuNameParam,
        Tier = skuTierParam,
      },
      Tags =
            {
                { "displayName", hostingPlanNameParam },
            },
    });

    var siteResource = new AzureNextGen.Web.V20181101.WebApp("siteResource", new AzureNextGen.Web.V20181101.WebAppArgs
    {
      Kind = "app",
      Location = resourceGroup.Location,
      Name = appNameParam,
      ResourceGroupName = resourceGroup.Name,
      ServerFarmId = serverfarmResource.Name,
      SiteConfig = new AzureNextGen.Web.V20181101.Inputs.SiteConfigArgs
      {
        AlwaysOn = appAlwaysOnParam,
        AppSettings =
                {
                    new AzureNextGen.Web.V20181101.Inputs.NameValuePairArgs
                    {
                        Name = "APPINSIGHTS_INSTRUMENTATIONKEY",
                        Value = "[reference(concat('microsoft.insights/components/',parameters('appInsightName')), '2015-05-01').InstrumentationKey]",
                    },
                    new AzureNextGen.Web.V20181101.Inputs.NameValuePairArgs
                    {
                        Name = "APPINSIGHTS_PROFILERFEATURE_VERSION",
                        Value = aPPINSIGHTSPROFILERFEATUREVERSIONParam,
                    },
                    new AzureNextGen.Web.V20181101.Inputs.NameValuePairArgs
                    {
                        Name = "APPINSIGHTS_SNAPSHOTFEATURE_VERSION",
                        Value = aPPINSIGHTSSNAPSHOTFEATUREVERSIONParam,
                    },
                    new AzureNextGen.Web.V20181101.Inputs.NameValuePairArgs
                    {
                        Name = "APPLICATIONINSIGHTS_CONNECTION_STRING",
                        Value = "[reference(concat('microsoft.insights/components/',parameters('appInsightName')), '2015-05-01').ConnectionString]",
                    },
                    new AzureNextGen.Web.V20181101.Inputs.NameValuePairArgs
                    {
                        Name = "ApplicationInsightsAgent_EXTENSION_VERSION",
                        Value = appInsightExtVersionParam,
                    },
                    new AzureNextGen.Web.V20181101.Inputs.NameValuePairArgs
                    {
                        Name = "DiagnosticServices_EXTENSION_VERSION",
                        Value = diagnosticServicesEXTENSIONVERSIONParam,
                    },
                    new AzureNextGen.Web.V20181101.Inputs.NameValuePairArgs
                    {
                        Name = "InstrumentationEngine_EXTENSION_VERSION",
                        Value = instrumentationEngineEXTENSIONVERSIONParam,
                    },
                    new AzureNextGen.Web.V20181101.Inputs.NameValuePairArgs
                    {
                        Name = "SnapshotDebugger_EXTENSION_VERSION",
                        Value = snapshotDebuggerEXTENSIONVERSIONParam,
                    },
                    new AzureNextGen.Web.V20181101.Inputs.NameValuePairArgs
                    {
                        Name = "XDT_MicrosoftApplicationInsights_BaseExtensions",
                        Value = xDTMicrosoftApplicationInsightsBaseExtensionsParam,
                    },
                    new AzureNextGen.Web.V20181101.Inputs.NameValuePairArgs
                    {
                        Name = "XDT_MicrosoftApplicationInsights_Mode",
                        Value = xDTAppInsightModeParam,
                    },
                    new AzureNextGen.Web.V20181101.Inputs.NameValuePairArgs
                    {
                        Name = "XDT_MicrosoftApplicationInsights_PreemptSdk",
                        Value = xDTMicrosoftApplicationInsightsPreemptSdkParam,
                    },
                },
      },
    });

    var armTemplateDeployName = $"{baseName}-stack";
    var exampleTemplateDeployment = new Azure.Core.TemplateDeployment(armTemplateDeployName, new Azure.Core.TemplateDeploymentArgs
    {
      ResourceGroupName = resourceGroup.Name,
      DeploymentMode = "Incremental",
      Name = armTemplateDeployName,
      Parameters = {
        {"siteName", siteResource.Name}
      },
      TemplateBody = @"{
    ""$schema"": ""https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#"",
    ""contentVersion"": ""1.0.0.0"",
    ""parameters"": {
        ""siteName"": {
            ""type"": ""string"",
            ""metadata"": {
                ""description"": ""The Azure App Service Name""
            }
        }
    },
    ""resources"": [
        {
            ""apiVersion"": ""2018-02-01"",
            ""name"": ""[parameters('siteName')]"",
            ""type"": ""Microsoft.Web/sites"",
            ""location"": ""[resourceGroup().location]"",
            ""properties"": {
                ""name"": ""[parameters('siteName')]"",
                ""siteConfig"": {
                    ""metadata"": [
                        {
                            ""name"": ""CURRENT_STACK"",
                            ""value"": ""dotnetcore""
                        }
                    ]
                }
            }
        }
    ]
}",
    });
  }
}
