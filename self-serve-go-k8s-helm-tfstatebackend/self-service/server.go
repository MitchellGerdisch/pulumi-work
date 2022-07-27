package main

import (
	"fmt"
	"log"
	"net/http"
	"github.com/selfserve/automation"
)

func main() {

	fileServer := http.FileServer(http.Dir("./static"))
 	http.Handle("/", fileServer)
	http.HandleFunc("/hello", helloHandler)
	http.HandleFunc("/form", formHandler)

	fmt.Printf("Starting server at port 8080\n")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}

func formHandler(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
			fmt.Fprintf(w, "ParseForm() err: %v", err)
			return
	}
	fmt.Fprintf(w, "POST request successful")
	name := r.FormValue("name")

	fmt.Fprintf(w, "Name = %s\n", name)

	automation.Automate(false, "demo", name)	

}

func helloHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/hello" {
		http.Error(w, "404 not found.", http.StatusNotFound)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method is not supported.", http.StatusNotFound)
		return
	}

	fmt.Fprintf(w, "Hello! Bonjour! Hola!")
}
