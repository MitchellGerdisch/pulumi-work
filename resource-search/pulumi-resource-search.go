package main

/*
.SYNOPSIS

.DESCRIPTION
Uses Pulumi service API to collect all the resources under management in the given Pulumi Organization.
The output it produces represents the resources deployed using the Pulumi service at that moment in time.
It does not provide any historical information.

This tool uses the Pulumi service API to read the data.

.EXAMPLE
pulumi-resource-search -service_host mypulumi.com -access_token pul-12345456 -orgs acme -resource myresourcegroup -csv

.PARAMETER service_host (OPTIONAL)
The pulumi service host name. For example, for the Pulumi SaaS this would be pulumi.com.
Default: pulumi.com

.PARAMETER access_token
A Pulumi access token that has access to the specified organization.

.PARAMETER orgs
OPTIONAL A comma-separated list of one or more pulumi organization(s) to search in.
Default: Search all organizations the user belongs to.

.PARAMETER id 
The id of the resource as it exists in the given cloud provider.

CROSS-COMPLIATION NOTES
env GOOS=windows GOARCH=amd64 go build ./pulumi-resource-search.go

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
	// "time"
	"sort"
	"strings"
)

type ResourceInfo struct {
	found				bool
	resourceId	string
	stackName  	string
}

type StackResourceIds struct {
	stackName string
	resources []string
}

func main() {

	// 0.1 version: Initial version
	version := "0.1"
	fmt.Println("pulumi-resource-search version " + version)

	// Process command line arguments
	service_host := flag.String("service_host", "", "(OPTIONAL) Pulumi service host name or IP. E.g. pulumi.com. Defaults to pulumi.com")
	access_token := flag.String("access_token", "", "Pulumi access token with access to specified Organization(s)")
	orgs_param := flag.String("orgs", "", "(OPTIONAL) Comma-separated list of Pulumi organization(s) to search in. Defaults to searching all orgs the user belongs to.")
	id := flag.String("id", "", "Resource id as it exists in the cloud provider.")

	flag.Parse()

	if (*access_token == "") {
		fmt.Println("*************")
		fmt.Println("Missing access_token command line argument ...")
		fmt.Println("Run \"" + os.Args[0] + " -h\" for more information.")
		fmt.Println("*************")
		os.Exit(1)
	}

	if *service_host == "" {
		fmt.Println("NOTE: Defaulting to use Pulumi SaaS at pulumi.com. Specify -service_host parameter for self-hosted service.")
		*service_host = "pulumi.com"
	}

	if (*id == "") {
		fmt.Println("*************")
		fmt.Println("Resource id to search for must be provided ...")
		fmt.Println("Run \"" + os.Args[0] + " -h\" for more information.")
		fmt.Println("*************")
	}
	// end command line arguments

	// Process orgs list 
	var orgs []string
	if (*orgs_param != "") {
		orgs = strings.Split(*orgs_param, ",")
	} else {
		orgs = getUserOrgs(*service_host, *access_token)
	}

	fmt.Println("\nSearching through the following orgs:\n", orgs)

	// Loop through given or discovered orgs and search for given resource
	for _, org := range orgs {

		fmt.Printf("\nSearching stacks in org, %s\n", org)

		// Get the Repos/Projects/Stacks information from the service
		reposResponse := getReposFromService(*service_host, *access_token, org)
		// Search for the resource across all the stacks in the org
		foundResource := searchStacks(*service_host, *access_token, org, *id, reposResponse)
		if (foundResource) {
			break
		}
	}

	// annnndddd scene
	fmt.Println("\nDone.")
}

// Walk through all the stacks and see if the resource ID is found
func searchStacks(service_host string, access_token string, org string, id string, reposResponse ReposApiResponse) bool {

	// Flags
	foundResource := false
	foundResourceStack := ""

	// Loop through the array of repos (which contain projects which contain stacks) from the API response
	repos := reposResponse.Repositories
	for _, repo := range repos {
		projects := repo.Projects

		for _, project := range projects {
			// Initialize the project object that stores the information about its stacks
			// var projectMetric ProjectMetric
			projectName := project.Name
			// fmt.Printf("Project: %s\n", projName)

			// Process the stacks in the projects
			stacks := project.Stacks
			// scratch variables to store data as we loop through the stacks
			// var projectStackMetrics []StackMetric

			for _, stack := range stacks {
				stackName := stack.Name
				// fmt.Printf("Stack: %s\n", stackName)
				var stackResourceIds StackResourceIds
				stackResourceIds = getStackResourcesIds(service_host, access_token, org, projectName, stackName)

				// Only check stacks that have resources which is indiced by stackName being set.
				if (stackResourceIds.stackName != "") {
					// fmt.Println(stackResourceIds)
					resources := stackResourceIds.resources
					// Search the resoruce IDs found for the given resource id
					sort.Strings(resources)
					i := sort.SearchStrings(resources, id)
					if i < len(resources) && resources[i] == id {
						foundResource = true
						foundResourceStack = stackResourceIds.stackName
						break
					}
				}
			}

			if (foundResource) {
				// fmt.Println("breaking project loop")
				break
			}
		}
		if (foundResource) {
			// fmt.Println("breaking repo loop")
			break
		}
	}
	if (foundResource) {
		fmt.Println("***************************************")
		fmt.Printf("Resource found in stack %s\n", foundResourceStack)
		fmt.Println("***************************************")
	} else {
		fmt.Printf("Resource not found in org, %s\n", org)
	}
	return(foundResource)
}

// calls service API for a given stack and returns a list of resource ids in the stack
func getStackResourcesIds(service_host string, access_token string, org string, project string, stack string) StackResourceIds {

	url := "https://api." + service_host + "/api/stacks/" + org + "/" + project + "/" + stack + "/resources/latest"
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

	var stackResources StackResourcesResponse
	if err := json.Unmarshal(body, &stackResources); err != nil { // Parse []byte to the go struct pointer
		fmt.Println("Cannot unmarshal JSON")
	}

	var stackResourceIds StackResourceIds
	for _, resource := range stackResources.Resources {
		// fmt.Println("resource")
		if (resource.Resource.ID != "") {
			stackResourceIds.stackName = org+"/"+project+"/"+stack
			stackResourceIds.resources = append(stackResourceIds.resources, resource.Resource.ID)
		}
	}
	return stackResourceIds
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

// calls service API to find all Pulumi orgs a user belongs to
func getUserOrgs(service_host string, access_token string) []string {

	url := "https://api." + service_host + "/api/user"
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

	var userOrgs UserOrgsResponse
	if err := json.Unmarshal(body, &userOrgs); err != nil { // Parse []byte to the go struct pointer
		fmt.Println("Cannot unmarshal JSON")
	}

	var orgs []string 
	for _, org := range userOrgs.Organizations {
		orgs = append(orgs, org.GithubLogin)
	}
	return orgs
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

// Autogenerated with some tinkering like struct above.
type StackResourcesResponse struct {
	Resources []struct {
		Resource struct {
			ID           string        `json:"id"`
			Type         string        `json:"type,omitempty"`
			Urn          string        `json:"urn,omitempty"`
			Custom       bool          `json:"custom,omitempty"`
			Delete       bool          `json:"delete,omitempty"`
			Dependencies []interface{} `json:"dependencies,omitempty"`
			Parent       string        `json:"parent,omitempty"`
			Inputs		 	 interface{}   `json:"inputs,omitempty"`
			Outputs      interface{}   `json:"outputs,omitempty"`
		} `json:"resource"`
	} `json:"resources,omitempty"`
	Region  string `json:"region,omitempty"`
	Version int    `json:"version,omitempty"`
}


// Autogenerated like the ones above
type UserOrgsResponse struct {
	ID            string `json:"id"`
	GithubLogin   string `json:"githubLogin"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	AvatarURL     string `json:"avatarUrl"`
	Organizations []struct {
		Name        string `json:"name"`
		GithubLogin string `json:"githubLogin"`
		AvatarURL   string `json:"avatarUrl"`
	} `json:"organizations"`
	Identities []string `json:"identities"`
	SiteAdmin  bool     `json:"siteAdmin"`
}