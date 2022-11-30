using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using NUnit.Framework;
using Pulumi.AzureNative.Storage;

namespace UnitTesting
{
	/// <summary>
	/// Unit testing examples.
	/// </summary>
	[TestFixture]
	public class StorageInfraTests
	{
		// Test that the component resource is setting the storage account kind correctly.
		[Test]
		public async Task StorageAccountKind()
		{
			var resources = await Testing.RunAsync<StorageInfraTestStack>();

			var sa = resources.OfType<StorageAccount>().FirstOrDefault();
			sa.Should().NotBeNull("Storage Account not found");

			var kind = await sa.Kind.GetValueAsync();
			(kind == "StorageV2").Should().BeTrue("Wrong storage account kind");
		}

		// Test that the StorageInfra component resource returns expected outputs.
		[Test]
		public async Task StorageInfraOutputs()
		{
			var resources = await Testing.RunAsync<StorageInfraTestStack>();

			var si = resources.OfType<StorageInfra>().FirstOrDefault();
			si.Should().NotBeNull("Storage Infra component object not found");

			var siSaName = await si.StorageAccountName.GetValueAsync();
			siSaName.Should().NotBeNull("StorageInfra component is not returning Storage Account Name.");

			var siScName = await si.StorageContainerName.GetValueAsync();
			siScName.Should().NotBeNull("StorageInfra component is not returning Storage Container Name.");

			var siSbName = await si.StorageBlobName.GetValueAsync();
			siSbName.Should().NotBeNull("StorageInfra component is not returning Storage Blob Name.");

			var siBlobUrl = await si.CodeBlobUrl.GetValueAsync();
			siBlobUrl.Should().NotBeNull("StorageInfra component is not returning Storage Blob URL.");
		}

		// Test that the blob storage type is correctly set by the StorageInfra component.
		// Shows a for loop.
		[Test]
		public async Task BlobTypeCheck()
		{
			var resources = await Testing.RunAsync<StorageInfraTestStack>();

			foreach (var blob in resources.OfType<Blob>())
			{
				var type = await blob.Type.GetValueAsync();
				(type == BlobType.Block).Should().BeTrue("Wrong blob type set by StorageInfra component.");

			}
		}
	}
}
