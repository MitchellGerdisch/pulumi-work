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
	}
}





