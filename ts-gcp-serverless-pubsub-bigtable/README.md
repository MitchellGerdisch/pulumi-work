# GCP Serverless-Pubsub-Firestore Example
Goals for this example:
- Use GCP to build a data pipeline of sorts.
- Show single-project and multi-project examples.
- Show component resources and modules.
- Testing
  - Unit testing for sure
  - Maybe property testing using policy as code

# Architecture

Frontend:
- Cloud function provides an API
  - Calls to the API push data into pubsub
Backend:
- Bigtable
- Pubsub 
- Cloud function
  - reads data from pubsub and pushes it into bigtable

# How to Use
- Deploy stack or stacks if using the multi-project version.
  - From top folder:
    - `npm i`
  - If doing `single-project`
    - cd to folder
    - `pulumi stack init dev`
    - `pulumi up`
  - If doing `multi-project`
    - cd to `backend` project folder
      - `pulumi stack init dev`
      - `pulumi up`
    - cd to `frontend` project folder
      - `pulumi stack init dev`
      - `pulumi up`
- The stack(s) will provide a couple of outputs:
  - `frontendUrl` click on this to generate data into pubsub and thus into bigtable.
    - To generate different "message body" add `?message=WHATEVERYOUWANT` to the URL.
  - `cbtCommand` this is a cbt command you can run to see the contents of bigtable.
    - The contents are simply a timestamp and the message sent in the URL (default is "Hello World").
    - You can install the cbt command as per: 
      - https://cloud.google.com/bigtable/docs/cbt-overview#installing 

# Unit Testing



# References
Capturing URLs of (possibly) useful information

General
- https://www.pulumi.com/blog/simple-serverless-programming-with-google-cloud-functions-and-pulumi/ 

Frontend-related
- https://github.com/pulumi/examples/tree/master/gcp-py-functions 
- https://github.com/pulumi/examples/tree/master/gcp-ts-functions 


Backend-related
- https://cloud.google.com/functions/docs/writing/write-event-driven-functions#cloudevent-functions 
- https://cloud.google.com/bigtable/docs/writing-data
- https://cloud.google.com/python/docs/reference/bigtable/latest 

Misc
- https://cloud.google.com/functions/docs/tutorials/use-cloud-bigtable
- https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/main/functions
- https://krapes.github.io/pubsub_bigtable/ 
- https://cloud.google.com/pubsub/docs/publish-receive-messages-client-library#node.js
- https://codelabs.developers.google.com/codelabs/serverless-web-apis#5
