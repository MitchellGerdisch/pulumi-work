package main

import (
	// "context"
	"flag"
	"fmt"
	"os"
	// "path/filepath"

	// "github.com/pulumi/pulumi/sdk/v3/go/auto"
	// "github.com/pulumi/pulumi/sdk/v3/go/auto/optdestroy"
	// "github.com/pulumi/pulumi/sdk/v3/go/auto/optup"

	"github.com/selfserve/deploy/automation"
)

func main() {

	destroyPtr := flag.Bool("destroy", false, "Destroys the stack(s).")
	orgPtr := flag.String("org", "demo", "Pulumi org to deploy in. Defaults to the demo org.")

	// The general flow will be to use a stack name that is based, say, on the requester's name.
	nostackname := "NO-STACK-SHOULD-HAVE-THIS-NAME"
	stackPtr := flag.String("stack", nostackname, "Stack name to update or create.")

	flag.Parse()

	// to destroy our program, we can run `go run main.go -destroy`
	destroy := *destroyPtr
	orgName := *orgPtr
	stackName := *stackPtr
	if stackName == nostackname {
		fmt.Println("Missing stack name: -stack STACKNAME")
		os.Exit(1)
	}
	fmt.Println("Using the following parameters:")
	fmt.Printf("orgName: %q\n", orgName)
	fmt.Printf("stackName: %q\n", stackName)
	fmt.Printf("destroy: %t\n", destroy)

	automation.Automate(destroy, orgName, stackName)
}

	// ctx := context.Background()

	// // Set up the config for the stacks
	// // A less lazy me would make this a bit more data driven from a json file or something and would put in a separate file.
	// type configObject struct {
	// 	configName  string
	// 	configValue string
	// }
	// config := []configObject{
	// 	{"aws:region", "us-east-2"},
	// 	{"tf_state_bucket", "mitch-tf-backend"},
	// 	{"tf_state_file_key", "tf-state"},
	// 	{"baseStackName", orgName + "/base-infra/" + stackName},
	// 	{"eksStackName", orgName + "/go-base-eks/" + stackName},
	// 	{"stackTag", "SelfServeDemoEnv"},
	// 	{"orgName", orgName},
	// 	{"appName", "SelfServiceDemo"},
	// }

	// // The Local Workspaces that make up this orchestrated deployment.
	// projectDirs := []string{"base-vpc", "go-base-eks", "go-k8s-apps"}
	// if destroy { // Reverse the order
	// 	for i, j := 0, len(projectDirs)-1; i < j; i, j = i+1, j-1 {
	// 		projectDirs[i], projectDirs[j] = projectDirs[j], projectDirs[i]
	// 	}
	// }

	// for _, projectDir := range projectDirs {

	// 	fmt.Printf("Processing project folder: %s\n", projectDir)
	// 	workDir := filepath.Join("../..", projectDir)

	// 	// create or select a stack from a local workspace
	// 	s, err := auto.UpsertStackLocalSource(ctx, stackPath, workDir)
	// 	if err != nil {
	// 		fmt.Printf("Failed to create or select stack: %v\n", err)
	// 		os.Exit(1)
	// 	}

	// 	fmt.Printf("Created/Selected stack %q\n", stackName)

	// 	// Set configs for each stack
	// 	for _, configItem := range config {
	// 		s.SetConfig(ctx, configItem.configName, auto.ConfigValue{Value: configItem.configValue})
	// 	}

	// 	fmt.Println("Starting refresh")

	// 	_, err = s.Refresh(ctx)
	// 	if err != nil {
	// 		fmt.Printf("Failed to refresh stack: %v\n", err)
	// 		os.Exit(1)
	// 	}

	// 	fmt.Println("Refresh succeeded!")

	// 	if destroy {
	// 		fmt.Println("Starting stack destroy")
	// 		// wire up our destroy to stream progress to stdout
	// 		stdoutStreamer := optdestroy.ProgressStreams(os.Stdout)
	// 		// destroy our stack and exit early
	// 		_, err := s.Destroy(ctx, stdoutStreamer)
	// 		if err != nil {
	// 			fmt.Printf("Failed to destroy stack: %v", err)
	// 		}
	// 		fmt.Println("Stack successfully destroyed")

	// 	} else {

	// 		fmt.Println("Starting update")

	// 		// wire up our update to stream progress to stdout
	// 		stdoutStreamer := optup.ProgressStreams(os.Stdout)

	// 		// run the update to deploy our fargate web service
	// 		// res, err := s.Up(ctx, stdoutStreamer)
	// 		_, err = s.Up(ctx, stdoutStreamer)
	// 		if err != nil {
	// 			fmt.Printf("Failed to update stack: %v\n\n", err)
	// 			os.Exit(1)
	// 		}

	// 		fmt.Println("Update succeeded!")
	// 	}
// 	}

// 	// // get the URL from the stack outputs
// 	// url, ok := res.Outputs["url"].Value.(string)
// 	// if !ok {
// 	// 	fmt.Println("Failed to unmarshall output URL")
// 	// 	os.Exit(1)
// 	// }

// 	// fmt.Printf("URL: %s\n", url)
// }
