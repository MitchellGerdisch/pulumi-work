# AWS (API Gateway) -> Lambda -> Event Bridge -> Lambda -> DynamoDB

The goal is to stand up an infrastructure that demonstrates the following use-case:

- There is a pre-existing API Gateway.
- I want to stand up a couple of lambda functions, an event bridge bus and a DynamoDB.
- I want to connect lambda #1 to the API GW.
- Lambda #1 receieves requests from the API GW and forwards them to the EventBridge
- Lambda #2 is triggered by EventBridge and writes data to the DynamoDB.

# Folder Contents

- existing-resources: this is a Pulumi project to create existing resources resources to be used as pre-existing resoruces for the main lambda-eventbridge-lambda-dynamodb project. This project is not directly referenced by the min project.
- lambda-eventbridge-dynamodb: this is the main project that stands up the system using the "existing" VPC and API GW.

# How to Run

- pulumi up
- Click on the provided URLs:
  - Base REST API link to send GET requests
  - Link to DynamoDB to show backend received and stored the event.
