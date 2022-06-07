// Copyright 2016-2021, Pulumi Corporation.  All rights reserved.

using System;
using System.Text;
using Pulumi;
using Pulumi.AzureAD;
using Pulumi.AzureNative.ContainerService;
using Pulumi.AzureNative.ContainerService.Inputs;
using Pulumi.AzureNative.Resources;
using Pulumi.Random;
using Pulumi.Tls;
using Pulumi.AzureNative.Storage;

class MyStack : Stack
{
    public MyStack()
    {
        // Config
        var config = new Pulumi.Config();
        var agentPoolCount = config.GetInt32("agentPoolCount") ?? 1; // Default to 1

        // Create an Azure Resource Group
        var resourceGroup = new ResourceGroup("azure-cs-aks");

        // Create an AD service principal
        var adApp = new Application("aks", new ApplicationArgs
        {
            DisplayName = "aks"
        });
        var adSp = new ServicePrincipal("aksSp", new ServicePrincipalArgs
        {
            ApplicationId = adApp.ApplicationId
        });

        // Create the Service Principal Password
        var adSpPassword = new ServicePrincipalPassword("aksSpPassword", new ServicePrincipalPasswordArgs
        {
            ServicePrincipalId = adSp.Id,
            EndDate = "2099-01-01T00:00:00Z"
        });

        // Generate an SSH key
        var sshKey = new PrivateKey("ssh-key", new PrivateKeyArgs
        {
            Algorithm = "RSA",
            RsaBits = 4096
        });

        var cluster = new ManagedCluster("my-aks", new ManagedClusterArgs
        {
            ResourceGroupName = resourceGroup.Name,
            AgentPoolProfiles =
            {
                new ManagedClusterAgentPoolProfileArgs
                {
                    Count = agentPoolCount,
                    MaxPods = 110,
                    Mode = "System",
                    Name = "agentpool",
                    OsDiskSizeGB = 30,
                    OsType = "Linux",
                    Type = "VirtualMachineScaleSets",
                    VmSize = "Standard_DS2_v2",
                }
            },
            DnsPrefix = "AzureNativeprovider",
            EnableRBAC = true,
            KubernetesVersion = "1.21.9",
            LinuxProfile = new ContainerServiceLinuxProfileArgs
            {
                AdminUsername = "testuser",
                Ssh = new ContainerServiceSshConfigurationArgs
                {
                    PublicKeys =
                    {
                        new ContainerServiceSshPublicKeyArgs
                        {
                            KeyData = sshKey.PublicKeyOpenssh,
                        }
                    }
                }
            },
            ServicePrincipalProfile = new ManagedClusterServicePrincipalProfileArgs
            {
                ClientId = adApp.ApplicationId,
                Secret = adSp.Id.Apply(id => { return(adSpPassword.Value); })
            }
        });

        // Export the KubeConfig
        this.kubeconfig = GetKubeConfig(resourceGroup.Name, cluster.Name);
    }

    [Output] public Output<string> kubeconfig { get; set; }

    private static Output<string> GetKubeConfig(Output<string> resourceGroupName, Output<string> clusterName)
        => ListManagedClusterUserCredentials.Invoke(new ListManagedClusterUserCredentialsInvokeArgs
        {
            ResourceGroupName = resourceGroupName,
            ResourceName = clusterName
        }).Apply(credentials => {
            var encoded = credentials.Kubeconfigs[0].Value;
            var data = Convert.FromBase64String(encoded);
            return Output.CreateSecret(Encoding.UTF8.GetString(data));
        });
}
