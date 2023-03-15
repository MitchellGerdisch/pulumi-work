# GCP Serverless-Pubsub-BigTable Example
Goals for this example:
- Use GCP to build a data pipeline of sorts.
- Demonstrate use case along the lines of:
  - app team writes front-end code and owns deploying the applicable front-end (i.e. serverless) infrastructure.
  - central team deploys and owns the shared resources like the pubsub and backend bits (maybe?)
    - the backend bits may make more sense to be owned by a different dev team.

# Architecture
Pretty much want to emulate this AWS example: https://github.com/MitchellGerdisch/pulumi-work/tree/master/ts-aws-api-lambda-eventbridge-lambda-dynamodb

Frontend:
- Cloud function provides an API
- Calls to the API push data into pubsub
Middle:
- pubsub
Backend:
- Cloud function or similar reads data from pubsub
- Pushes data into BigTable


# References
Capturing URLs of (possibly) useful information
- https://cloud.google.com/functions/docs/tutorials/use-cloud-bigtable
- https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/main/functions
- https://krapes.github.io/pubsub_bigtable/ 
