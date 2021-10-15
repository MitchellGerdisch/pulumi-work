// Get the info about the infrastructure that was just created/updated by Pulumi
const { infraInfo } = require('./infra_info')
const eventBusName = infraInfo.eventBusName
const eventSource = infraInfo.eventSource

// Setup for passing stuff to the bus
const AWS = require('aws-sdk')
AWS.config.region = process.env.AWS_REGION || 'us-east-1'
const eventbridge = new AWS.EventBridge()

// Handle requests
// This is a simple function that handles GET requests and 
// creates an event for EventBridge that contains a timestamp and any query parameters.
exports.handler = async (event, context) => {
  const timestamp = Date.now()
  const eventDetailsBase = {timestamp: timestamp}

  let queryParams = event.queryStringParameters
  if (!queryParams) {
    queryParams = {"message":"hello world"}
  }

  const eventDetails = {...eventDetailsBase, ...queryParams}

  // parameters for EventBus sdk call 
  const params = {
    Entries: [ 
    {
      // Event envelope fields
      Source: eventSource, // provided by Pulumi code at deployment
      EventBusName: eventBusName, // provided by Pulumi code at deployment
      DetailType: 'transaction',
      Time: timestamp,
      // Main event body
      Detail: JSON.stringify(eventDetails)
    },
  ]}

  // console.log('--- Params ---')
  // console.log(params)
  //const result = JSON.stringify(params) 
  const result = await eventbridge.putEvents(params).promise()

  console.log('--- Response ---')
  console.log(result)  

  return {
      statusCode: 200,
      body: JSON.stringify(params, null, 4)
  };
}