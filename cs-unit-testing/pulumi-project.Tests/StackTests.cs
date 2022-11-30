using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using NUnit.Framework;
using Pulumi.AzureNative.Storage;
using Pulumi.AzureNative.Web;

namespace UnitTesting
{
	/// <summary>
	/// Unit testing examples.
	/// </summary>
	[TestFixture]
	public class StackTests
	{

		// Test that the stack is setting the app service plan tier correctly.
		[Test]
		public async Task AppServicePlanTier()
		{
			// Set config environment variables
			var pulumiConfig = "{\"project:baseName\":\"mitch\", \"project:sqlPassword\":\"mitch#123\"}";
			Environment.SetEnvironmentVariable("PULUMI_CONFIG", pulumiConfig);

			var resources = await Testing.RunAsync<StackCompResources>();

			var appServicePlan = resources.OfType<AppServicePlan>().FirstOrDefault();
			appServicePlan.Should().NotBeNull("App Service Plan not found");

			var skuTier = await appServicePlan.Sku.GetValueAsync();
			(skuTier.Tier == "Basic").Should().BeTrue("Wrong App Service Plan tier. Should be \"Basic\".");
		}

		// // Test that the StorageInfra component resource returns expected outputs.
		// [Test]
		// public async Task StorageInfraOutputs()
		// {
		// 	var resources = await Testing.RunAsync<StorageInfraTestStack>();

		// 	var si = resources.OfType<StorageInfra>().FirstOrDefault();
		// 	si.Should().NotBeNull("Storage Infra component object not found");

		// 	var siSaName = await si.StorageAccountName.GetValueAsync();
		// 	siSaName.Should().NotBeNull("StorageInfra component is not returning Storage Account Name.");

		// 	var siScName = await si.StorageContainerName.GetValueAsync();
		// 	siScName.Should().NotBeNull("StorageInfra component is not returning Storage Container Name.");

		// 	var siSbName = await si.StorageBlobName.GetValueAsync();
		// 	siSbName.Should().NotBeNull("StorageInfra component is not returning Storage Blob Name.");

		// 	var siBlobUrl = await si.CodeBlobUrl.GetValueAsync();
		// 	siBlobUrl.Should().NotBeNull("StorageInfra component is not returning Storage Blob URL.");
		// }

		// // Test that the blob storage type is correctly set by the StorageInfra component.
		// // Shows a for loop.
		// [Test]
		// public async Task BlobTypeCheck()
		// {
		// 	var resources = await Testing.RunAsync<StorageInfraTestStack>();

		// 	foreach (var blob in resources.OfType<Blob>())
		// 	{
		// 		var type = await blob.Type.GetValueAsync();
		// 		(type == BlobType.Block).Should().BeTrue("Wrong blob type set by StorageInfra component.");

		// 	}
		// }
	}
}



// using NUnit.Framework;
// using Pulumi.Utilities;

// namespace UnitTesting
// {
// 	  [TestFixture]
// 	  public class StorgeInfraTests
// 	  {
// 			// check 1: Instances have a Name tag.
// 				[Test]
// 				public async Task StorageAccountKind()
// 				{
// 						var resources = await Testing.RunAsync<WebserverStack>();

// 						var instance = resources.OfType<Instance>().FirstOrDefault();
// 						instance.Should().NotBeNull("EC2 Instance not found");

// 						var tags = await OutputUtilities.GetValueAsync(instance.Tags);
// 						tags.Should().NotBeNull("Tags are not defined");
// 						tags.Should().ContainKey("Name");
// 				}

// 				public static Task<T> GetValueAsync<T>(this Output<T> output)
// 				{
// 						var tcs = new TaskCompletionSource<T>();
// 						output.Apply(v =>
// 						{
// 								tcs.SetResult(v);
// 								return v;
// 						});
// 						return tcs.Task;
// 				}
//         // TODO(check 1): Instances have a Name tag.
//         // TODO(check 2): Instances must not use an inline userData script.
//         // TODO(check 3): Instances must not have SSH open to the Internet.
// 	  }

// }





