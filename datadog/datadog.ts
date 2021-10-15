import * as datadog from "@pulumi/datadog";
import * as pulumi from "@pulumi/pulumi";

// Sets up Datadog with a monitor for the given instance and a custom dashboard.
interface TargetType {
  hostName: string;
  hostId: string;
}

export function setupDatadog(target: TargetType) {
  const hostName = target["hostName"]
  const hostId = target["hostId"]

  // Create Datadog Monitor for the Instance just created
  const dogMonitor = new datadog.Monitor("dog-monitor", {
    name: hostName+"-cpu-monitor",
    message: hostName+"-cpu Monitor",
    type: "metric alert",
    query: "avg(last_1m):avg:datadog.trace_agent.cpu_percent{host:"+hostId+"} > 10"
  })

  // Create Datadog Dashboard that pulls together data from the monitor and the host.
  const dogDashboard = new datadog.Dashboard("dog-dash", {
    layoutType: "ordered",
    title: "Pulumi Managed Dashboard for "+hostName,
    widgets: [
        {
            alertValueDefinition: {
              "alertId": dogMonitor.id,
              "title": dogMonitor.name,
              "titleSize": "16",
              "titleAlign": "left",
              "unit": "auto",
              "textAlign": "left",
              "precision": 2
              },
        },
        {
            timeseriesDefinition: {
              "title": "Avg of CPU Utilization over host:"+hostId,
              "titleSize": "16",
              "titleAlign": "left",
              "showLegend": false,
              "time": {},
              "requests": [
                {
                  "q": "avg:system.cpu.user{host:"+hostId+"}",
                  "style": {
                    "palette": "dog_classic",
                    "lineType": "solid",
                    "lineWidth": "normal"
                  },
                  "displayType": "line"
                }
              ],
              "yaxis": {
                "scale": "linear",
                "label": "",
                "includeZero": true,
                "min": "auto",
                "max": "auto"
              },
              "markers": []
            }
        }
    ]
  })

  return dogDashboard
}

//// Datadog API and APP Key Check 
function keyMessage(keyName: string) {
  console.log(`*** MISSING ${keyName} config`)
  console.log("*** DataDog Dashboard will NOT be created.")
  console.log("*** Get key from DataDog console: Integrations -> APIs")
  console.log(`*** And execute the command: pulumi config set ${keyName} --secret`)
  console.log("***")
}
export function checkKeys() {
  const config = new pulumi.Config();
  let apiKey = config.get("apiKey") || "no-dog"
  let appKey = config.get("appKey") || "no-dog"
  if (apiKey === "no-dog") keyMessage("apiKey")
  if (appKey === "no-dog") {
    keyMessage("appKey")
    apiKey = "no-dog"
  }
  return apiKey // we overload apiKey to indicate whether or not we should do DataDog stuff
}
