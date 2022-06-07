using Pulumi;
using K8s = Pulumi.Kubernetes;
using Pulumi.Command.Local;

using Pulumi.K8sServiceDeployment;

class Guestbook : Stack
{
    public Guestbook()
    {
        var config = new Config();
        var isMiniKube = config.GetBoolean("isMiniKube") ?? false;
        var org = config.Require("org");
        var k8sStackProject = config.Require("k8sProject");
        var currentStack = Deployment.Instance.StackName;
        var k8sStackName = $"{org}/{k8sStackProject}/{currentStack}";
        var k8sStackRef = new StackReference(k8sStackName);

        var kubeConfig = Output.Format($"{k8sStackRef.RequireOutput("kubeconfig").Apply(v => v.ToString())}"); 
        var provider = new K8s.Provider("k8s", new K8s.ProviderArgs { KubeConfig = kubeConfig });
        var options = new ComponentResourceOptions { Provider = provider };

        var redisLeader = new ServiceDeployment("redis-leader", new ServiceDeploymentArgs
        {
            Image = "redis",
            Ports = {6379}
        }, options);

        var redisReplica = new ServiceDeployment("redis-replica", new ServiceDeploymentArgs
        {
            Image = "pulumi/guestbook-redis-replica",
            Ports = {6379}
        }, options);

        var frontend = new ServiceDeployment("frontend", new ServiceDeploymentArgs
        {
            Replicas = 3,
            Image = "pulumi/guestbook-php-redis",
            Ports = {80},
            ServiceType = "LoadBalancer",
        }, options);

        this.FrontendIp = frontend.FrontEndIp.Apply(ip => "http://"+ip);

        var launchAppBrowser = new Command("guestbookAppBrowser", new CommandArgs
        {
            Dir = "../powershell",
            Create = this.FrontendIp.Apply(url => "pwsh launchGuestBookWebpage.ps "+url),
        });
    }

    [Output] public Output<string> FrontendIp { get; set; }
}
