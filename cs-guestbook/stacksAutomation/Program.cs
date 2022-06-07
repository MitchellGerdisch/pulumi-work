using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Pulumi.Automation;

namespace LocalProgram
{
    class Program
    {
        static async Task Main(string[] args)
        {
            // to destroy our program, we can run "dotnet run destroy"
            if (args.Length > 0) {
                Console.WriteLine(args);
            }

            bool destroy = false;
            string stackName = "";
            foreach (string arg in args) { 
                if (arg == "destroy") {
                    destroy = true;
                }
                else {
                    stackName = arg;
                }
            }
            if (String.IsNullOrEmpty(stackName)) {
                Console.WriteLine("No Stack Name Provided.");
                return;
            } else {
                Console.WriteLine($"Processing stack {stackName}");
            }

            string[] projects = {"aks-base-infra", "guestbook-app"};

            if (destroy) {
                foreach (string project in projects.Reverse()) {
                    await CreateOrDestroy(destroy, project, stackName);
                }
            } else {
                foreach (string project in projects) {
                    await CreateOrDestroy(destroy, project, stackName);
                }
            }
        }
        public static async Task CreateOrDestroy(bool destroy, string project, string stackName) {

            // get the path to the local program
            var executingDir = new DirectoryInfo(Assembly.GetExecutingAssembly().Location).Parent.FullName;
            var workingDir = Path.Combine(executingDir, "..", "..", "..", "..", project);

            // create our base infra stack using a local program in the base-infra project
            var stackArgs = new LocalProgramArgs(stackName, workingDir);
            var stack = await LocalWorkspace.CreateOrSelectStackAsync(stackArgs);
            Console.WriteLine($"successfully initialized stack {stackName}");

            // set config
            await stack.SetConfigAsync("azure-native:location", new ConfigValue("CentralUS"));
            await stack.SetConfigAsync("guestbook-app-cs:k8sProject", new ConfigValue("guestbook-base-aks-infra-cs"));
            await stack.SetConfigAsync("guestbook-app-cs:org", new ConfigValue("demo"));

            Console.WriteLine("refreshing stack...");
            await stack.RefreshAsync();
            Console.WriteLine("refresh complete");

            if (destroy) {
                Console.WriteLine("destroying stack...");
                await stack.DestroyAsync(new DestroyOptions { OnStandardOutput = Console.WriteLine });
                Console.WriteLine("stack destroy complete");
            } else {
                Console.WriteLine("updating stack...");
                var result = await stack.UpAsync(new UpOptions { OnStandardOutput = Console.WriteLine });

                if (result.Summary.ResourceChanges != null)
                {
                    Console.WriteLine("update summary:");
                    foreach (var change in result.Summary.ResourceChanges)
                        Console.WriteLine($"    {change.Key}: {change.Value}");
                }
            } 
        }
    }
}

