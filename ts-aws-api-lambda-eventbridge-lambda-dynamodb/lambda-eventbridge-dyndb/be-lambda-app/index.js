const AWS = require('aws-sdk')
AWS.config.region = process.env.AWS_REGION || 'us-east-1'
const dynamoDB = new AWS.DynamoDB.DocumentClient()

exports.handler = async (event) => {
  console.log('--- processed an event ---')
  console.log(JSON.stringify(event, null, 2))
  const { infraInfo } = require('./infra_info')
  console.log("**** infra info ****", infraInfo)
      // Push the event into the table and assume success.
      const putObject = {
          TableName: infraInfo.tableName,
          Item: event.detail
      }
      const pushresult = await dynamoDB.put(putObject).promise()
      console.log("**** push result ****", pushresult)
}