package main

/*
.SYNOPSIS

.DESCRIPTION
Uses Pulumi service API to collect resource usage metrics for a given organization.
The output it produces represents the resources deployed using the Pulumi service at that moment in time.
It does not provide any historical information.

This tool uses the Pulumi service API to read the data.

.EXAMPLE
pulumi-rum-counter -service_host mypulumi.com -access_token pul-12345456 -org acme -csv

.PARAMETER service_host (OPTIONAL)
The pulumi service host name. For example, for the Pulumi SaaS this would be pulumi.com.
Default: pulumi.com

.PARAMETER access_token
A Pulumi access token that has access to the specified organization.

.PARAMETER org
The pulumi organization from which to gather the metrics.

.PARAMETER csv (OPTIONAL)
Flag to indicate that output should be CSV format

CROSS-COMPLIATION NOTES
env GOOS=windows GOARCH=amd64 go build ./pulumi-rum-counter.go

*/

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	// // used if debugging http "net/http/httputil"
	"crypto/tls"
	"flag"
	"os"
	"time"
)

type RumMetrics struct {
	totalRum       int
	projectMetrics []ProjectMetric
}
type ProjectMetric struct {
	projName     string
	projTotalRum int
	stackMetrics []StackMetric
}
type StackMetric struct {
	projName   string
	stackName  string
	lastUpdate string
	rum        int
}

func main() {

	// 0.1 version: Initial version
	version := "0.2"
	fmt.Println("pulumi-rum-counter version " + version)

	// Process command line arguments
	service_host := flag.String("service_host", "", "Pulumi service host name or IP. E.g. pulumi.com. Defaults to pulumi.com")
	access_token := flag.String("access_token", "", "Pulumi access token with access to specified Organization")
	org := flag.String("org", "", "Pulumi organization from which to gather resource counts.")
	csv := flag.Bool("csv", false, "Flag to indicate if output should be in CSV format.")

	flag.Parse()

	if (*access_token == "") || (*org == "") {
		fmt.Println("*************")
		fmt.Println("Missing command line argument ...")
		fmt.Println("Run \"" + os.Args[0] + " -h\" for more information.")
		fmt.Println("*************")
		os.Exit(1)
	}

	if *service_host == "" {
		fmt.Println("NOTE: Defaulting to use Pulumi SaaS at pulumi.com. Specify -service_host parameter for self-hosted service.")
		*service_host = "pulumi.com"
	}
	// end command line arguments

	time_now := time.Now().Format(time.RFC3339)
	fmt.Printf("Gathering RUM data as of %s\n\n", time_now)

	// Get the Repos/Projects/Stacks information from the service
	reposResponse := getReposFromService(*service_host, *access_token, *org)

	// Tabulate RUM metrics from the repos/projects/stacks information
	rumMetrics := getRumMetrics(reposResponse)

	// Print out the RUM data in a nice way.
	printRumMetrics(*csv, rumMetrics)

	// annnndddd scene
	fmt.Println("\nDone.")
}

// Tabulate RUM metrics from the data received from the service.
func getRumMetrics(reposResponse ReposApiResponse) RumMetrics {
	// Initialize our top level object that will contain the RUM data for the projects and stacks.
	var rumMetrics RumMetrics

	// Loop through the array of repos (which contain projects which contain stacks) from the API response
	repos := reposResponse.Repositories
	for _, repo := range repos {
		projects := repo.Projects

		// Loop through the projects
		for _, project := range projects {
			// Initialize the project object that stores the information about it's stacks
			var projectMetric ProjectMetric
			projectMetric.projName = project.Name
			// fmt.Printf("Project: %s\n", projectMetric.projName)

			// Process the stacks in the projects
			stacks := project.Stacks
			// scratch variables to store data as we loop through the stacks
			var projectStackMetrics []StackMetric
			projectRum := 0
			for _, stack := range stacks {
				var stackMetrics StackMetric
				stackMetrics.stackName = stack.Name
				// fmt.Printf("Stack: %s\n", stackMetrics.stackName)

				stackRum := 0
				lastUpdate := "unknown"
				// Check if there is a last update property.
				// If so, then that's where the current rum count is found.
				if stack.LastUpdate != nil {
					stackRum = stack.LastUpdate.ResourceCount
					//lastUpdate = time.Unix(int64(stack.LastUpdate.EndTime), 0).String()
					//lastUpdate = time.Unix(int64(stack.LastUpdate.EndTime), 0).Format("Jan _2 2006")
					lastUpdate = time.Unix(int64(stack.LastUpdate.EndTime), 0).Format("2006-01-02")
					projectRum = projectRum + stackRum
				}
				// update the stack metrics with the stack-specific RUM count
				stackMetrics.rum = stackRum
				stackMetrics.lastUpdate = lastUpdate
				// Push the stack metrics on the array of stack metrics for the project
				projectStackMetrics = append(projectStackMetrics, stackMetrics)
			}
			// Update the project object with the project-specific data.
			projectMetric.projTotalRum = projectRum
			projectMetric.stackMetrics = projectStackMetrics

			// Add the project data to the top level RUM object and update the total rum count
			rumMetrics.projectMetrics = append(rumMetrics.projectMetrics, projectMetric)
			rumMetrics.totalRum = rumMetrics.totalRum + projectMetric.projTotalRum
		}
	}
	return rumMetrics
}

// Outputs the RUM metrics in a nice way
func printRumMetrics(csv bool, rumMetrics RumMetrics) {
	if csv {
		// Print as a CSV-like report
		fmt.Printf("Total RUM,%d\n", rumMetrics.totalRum)
		fmt.Printf("Project Name,Stack Name,RUM\n")
		for _, project := range rumMetrics.projectMetrics {
			for _, stack := range project.stackMetrics {
				fmt.Printf("%s,%s,%s, %d\n", project.projName, stack.stackName, stack.lastUpdate, stack.rum)
			}
		}
	} else {
		// Print in a semi-human friendly way
		fmt.Printf("Total RUM: %d\n*******\n", rumMetrics.totalRum)
		for _, project := range rumMetrics.projectMetrics {
			fmt.Printf("Project: %s; Project RUM: %d\n", project.projName, project.projTotalRum)
			for _, stack := range project.stackMetrics {
				fmt.Printf("Stack: %s; Stack Last Update: %s; Stack RUM: %d\n", stack.stackName, stack.lastUpdate, stack.rum)
			}
			fmt.Println("-------")
		}
	}
}

// Calls Pulumi Service API to get the list of repos/project/stacks.
func getReposFromService(service_host string, access_token string, org string) ReposApiResponse {
	url := "https://api." + service_host + "/api/console/orgs/" + org + "/repos"
	method := "GET"

	customTransport := http.DefaultTransport.(*http.Transport).Clone()
	customTransport.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
	client := &http.Client{Transport: customTransport}

	// create and make the request
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		fmt.Println(err)
	}
	req.Header.Add("Authorization", "token "+access_token)
	res, err := client.Do(req)
	if err != nil {
		fmt.Println(err)
		os.Exit(3)
	}

	defer res.Body.Close()
	// essentially creates a stringified version of the body's json
	body, _ := ioutil.ReadAll(res.Body)
	// fmt.Println(string(body))

	var reposApiResponse ReposApiResponse
	if err := json.Unmarshal(body, &reposApiResponse); err != nil { // Parse []byte to the go struct pointer
		fmt.Println("Can not unmarshal JSON")
	}

	return reposApiResponse
}

// AUTO GENERATED from here: https://mholt.github.io/json-to-go/
// You can use PostMan to get a response and then use the json-to-go to create this struct.
// Be sure to remove initial Projects that are missing Stacks Lastupdate structure.
type ReposApiResponse struct {
	OrganizationFeatures struct {
		AuditLogsEnabled            bool `json:"auditLogsEnabled"`
		CrossGuardEnabled           bool `json:"crossGuardEnabled"`
		WebhooksEnabled             bool `json:"webhooksEnabled"`
		IntegrationAssistantEnabled bool `json:"integrationAssistantEnabled"`
		TeamSkuAvailable            bool `json:"teamSkuAvailable"`
	} `json:"organizationFeatures"`
	Repositories []struct {
		OrgName  string      `json:"orgName"`
		Name     string      `json:"name"`
		VcsInfo  interface{} `json:"vcsInfo"`
		Projects []struct {
			OrgName     string `json:"orgName"`
			RepoName    string `json:"repoName"`
			Name        string `json:"name"`
			Runtime     string `json:"runtime"`
			Description string `json:"description,omitempty"`
			Stacks      []struct {
				Name       string `json:"name"`
				LastUpdate *struct {
					Result        string `json:"result"`
					StartTime     int    `json:"startTime"`
					EndTime       int    `json:"endTime"`
					ResourceCount int    `json:"resourceCount"`
				} `json:"lastUpdate"`
				RoutingRepo    string `json:"routingRepo"`
				RoutingProject string `json:"routingProject"`
				Tags           struct {
					GitHubOwner           string `json:"gitHub:owner"`
					PulumiDescription     string `json:"pulumi:description"`
					PulumiProject         string `json:"pulumi:project"`
					PulumiRuntime         string `json:"pulumi:runtime"`
					PulumiSecretsProvider string `json:"pulumi:secrets_provider"`
				} `json:"tags"`
				ProtectedByPolicy bool `json:"protectedByPolicy"`
			} `json:"stacks"`
		} `json:"projects"`
	} `json:"repositories"`
	ContinuationToken interface{} `json:"continuationToken"`
}
