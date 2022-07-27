package main

import (
	"flag"
	"fmt"
	"os"
	"github.com/selfserve/automation"
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
