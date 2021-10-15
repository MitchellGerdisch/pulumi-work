import * as pulumi from '@pulumi/pulumi';
import * as azure_nextgen from '@pulumi/azure-nextgen';
import { profile } from 'console';

const config = new pulumi.Config();

const resourceGroup = new azure_nextgen.resources.latest.ResourceGroup('resourceGroup', {
  //MRG resourceGroupName: 'rg-pulumiNextGen',
  resourceGroupName: 'mitch-rg-pulumiNextGen',
  location: 'uksouth',
});

//MRG changed to latest: const virtualNetwork = new azure_nextgen.network.v20200601.VirtualNetwork('server-network', {
const virtualNetwork = new azure_nextgen.network.latest.VirtualNetwork('server-network', {
  resourceGroupName: resourceGroup.name,
  location: resourceGroup.location,
  // MRG virtualNetworkName: 'vnet-puluminextgen',
  virtualNetworkName: 'mitch-vnet-puluminextgen',
  addressSpace: { addressPrefixes: ['10.4.1.0/24'] },
});

//MRG changed to latest: const subvnet01 = new azure_nextgen.network.v20200601.Subnet('subnet01', {
const subvnet01 = new azure_nextgen.network.latest.Subnet('subnet01', {
  resourceGroupName: resourceGroup.name,
  // MRG subnetName: 'subnet-pulumiNextGen01',
  subnetName: 'mitch-subnet-pulumiNextGen01',
  virtualNetworkName: virtualNetwork.name,
  addressPrefix: '10.4.1.0/27',
});
//MRG changed to latest:  const subvnet02 = new azure_nextgen.network.v20200601.Subnet('subnet02', {
const subvnet02 = new azure_nextgen.network.latest.Subnet('subnet02', {
  resourceGroupName: resourceGroup.name,
  //MRG subnetName: 'subnet-pulumiNextGen02',
  subnetName: 'mitch-subnet-pulumiNextGen02',
  virtualNetworkName: virtualNetwork.name,
  addressPrefix: '10.4.1.32/27',
});

const storageAccount = new azure_nextgen.storage.latest.StorageAccount('sa', {
  resourceGroupName: resourceGroup.name,
  //MRG accountName: 'stpuluminextgen01',
  accountName: 'mitchstpuluminextgen01',
  location: resourceGroup.location,
  sku: {
    name: 'Standard_LRS',
    //MRG-FIX: remove - tier: "Standard",
    // tier is not part of the sku input - see https://www.pulumi.com/docs/reference/pkg/azure-nextgen/storage/storageaccount/#sku
  },
  kind: 'StorageV2',
});

const blobContainer = new azure_nextgen.storage.latest.BlobContainer('blobContainer', {
  accountName: storageAccount.name,
  //MRG containerName: '$web',
  containerName: 'mitchweb',
  resourceGroupName: resourceGroup.name,
});

const appinsights = new azure_nextgen.insights.latest.Component('appinsights', {
  //MRG resourceName: 'appi-puluminextgetn01',
  resourceName: 'mitch-appi-puluminextgetn01',
  location: resourceGroup.location,
  applicationType: 'web',
  kind: 'web',
  resourceGroupName: resourceGroup.name,
});

export const instrumentationKey = appinsights.instrumentationKey;
const appServicePlan = new azure_nextgen.web.latest.AppServicePlan('appServicePlan', {
  resourceGroupName: resourceGroup.name,
  kind: 'app',
  location: resourceGroup.location,
  //MRG name: 'plan-puluminextgen01',
  name: 'mitch-plan-puluminextgen01',
  sku: {
    capacity: 1,
    family: 'D',
    name: 'D1',
    size: 'D1',
    tier: 'Shared',
  },
});

//MRG changed to latest: const webapp = new azure_nextgen.web.v20200601.WebApp('webapp', {
const webapp = new azure_nextgen.web.latest.WebApp('webapp', {
  resourceGroupName: resourceGroup.name,
  location: resourceGroup.location,
  //MRG name: 'app-puluminextgen01',
  name: 'mitch-webapp-puluminextgen01',
  enabled: true,
  serverFarmId: appServicePlan.id,
});

const cdnprofile = new azure_nextgen.cdn.latest.Profile('cdnprofile', {
  resourceGroupName: resourceGroup.name,
  location: 'global',
  //MRG profileName: 'cdn-puluminextGen',
  profileName: 'mitch-cdn-puluminextGen',
  sku: {
    name: 'Standard_Microsoft',
  },
});

const endpoint = new azure_nextgen.cdn.latest.Endpoint('endpoint', {
  resourceGroupName: resourceGroup.name,
  location: cdnprofile.location,
  profileName: cdnprofile.name,
  //MRG endpointName: 'edge-pulumiNetGen',
  endpointName: 'mitch-edge-pulumiNetGen',
  isHttpAllowed: false,
  isHttpsAllowed: true,
  originHostHeader: 'www.contoso.com',
  origins: [
    {
      name: 'hostheader',
      hostName: '192.168.1.254',
    },
  ],
  contentTypesToCompress: ['text/html', 'application/octet-stream'],
  deliveryPolicy: {
    rules: [
      {
        name: 'UrlRewriteRule', // MRG name for a given "DeliveryRule" string
        actions: [
          {
            // MRG-FIX added name - without name, intellisense couldn't figure out it was a UrlRewriteAction parameter structure
            // intellisense recommends the available values
            // A document issue has been opened to better document the need for the name parameter:
            // https://github.com/pulumi/docs/issues/4383
            name: 'UrlRewrite',
            parameters: {
              destination: '/mobile',
              odataType: '#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlRewriteActionParameters',
              preserveUnmatchedPath: true,
              sourcePattern: '/source',
            },
          },
        ],
        order: 1,
        conditions: [
          {
            // MRG-FIX: Along the same lines as the fix for the action, replaced "DeliverRuleUrlFileExtensionCondition" with "name" property and the same value.
            name: 'UrlFileExtension',
            parameters: {
              odataType: '#Microsoft.Azure.Cdn.Models.DeliveryRuleUrlFileExtensionMatchConditionParameters',
              matchValues: ['0'],
              negateCondition: false,
              operator: 'LessThanOrEqual',
              transforms: ["Lowercase"], // Can be Loewrcase or Uppercase. Found this by putting in a garbage value and seeing error message back from Azure. 
            },
          },
        ],
      },
    ],
  },
});
