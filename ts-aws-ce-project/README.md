# Best Practices Project

\***\* WIP \*\*\***
See index.ts for current plans.

This folder contains a Pulumi project to show various Pulumi concepts and practices, including but not limited to:

- Custom Resources
- Modules
- Helper Functions
- Transformations
- Data sources and .get() functions
- Unit and integration testing

# Project Architecture

New thoughts

- vue app running on eks
- vue app hits documentdb backend
- other parts?

Initial focus on the API gateway on down.
Will look at the LB and instances later.

- [Load balancer to a]
- [instance scaling group that presents a web site and sends data to a]
- API Gateway to a
- Lambda to
- MSK --- SOMETHING ELSE? MSK takes a long time to launch ...
- Fargate instance reads from MKS
- Fargate write to DynamoDB?

## Components

- Base VPC (maybe as a stack?)
- [Web Frontend = LB and Instances] (later)
- API frontend = API GW and Lambda
- MKS queue
- Backend = Fargate plus DynamoDB
