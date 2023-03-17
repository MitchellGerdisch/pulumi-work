# GCP Serverless-Pubsub-Firestore Example
Goals for this example:
- Use GCP to build a data pipeline of sorts.
- Maybe demonstrate use case along the lines of:
  - app team writes front-end code and owns deploying the applicable front-end (i.e. serverless) infrastructure.
  - central team deploys and owns the shared resources like the pubsub and backend bits (maybe?)
    - the backend bits may make more sense to be owned by a different dev team.

# Architecture
Pretty much want to emulate this AWS example: 
https://github.com/MitchellGerdisch/pulumi-work/tree/master/ts-aws-api-lambda-eventbridge-lambda-dynamodb

Frontend:
- Cloud function provides an API
- Calls to the API push data into pubsub
Middle:
- pubsub
Backend:
- Cloud function or similar reads data from pubsub
- Pushes data into backend nosql


# How to Use
- Deploy stack
- Click on the `frontendUrl` to generate data into pubsub and thus into bigtable.
  - To generate different "message body" add `?message=WHATEVERYOUWANT` to the URL.
- To see the data in pubsub go to the given pubsub resource and select subscriptions and then Messages and click the `Pull` "button" to show values.
- To see the data in BigTable, you can use the `cbt` CLI
  - Installation: https://cloud.google.com/bigtable/docs/cbt-overview#installing 




# References
Capturing URLs of (possibly) useful information

General
- https://www.pulumi.com/blog/simple-serverless-programming-with-google-cloud-functions-and-pulumi/ 

Frontend-related
- https://github.com/pulumi/examples/tree/master/gcp-py-functions 
- https://github.com/pulumi/examples/tree/master/gcp-ts-functions 


Backend-related
- https://cloud.google.com/functions/docs/writing/write-event-driven-functions#cloudevent-functions 



- https://cloud.google.com/functions/docs/tutorials/use-cloud-bigtable
- https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/main/functions
- https://krapes.github.io/pubsub_bigtable/ 
- https://cloud.google.com/pubsub/docs/publish-receive-messages-client-library#node.js

- https://codelabs.developers.google.com/codelabs/serverless-web-apis#5
