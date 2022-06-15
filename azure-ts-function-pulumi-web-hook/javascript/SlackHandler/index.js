// This is Azure function code that sends a message to slack when invoked.

https = require('https');

// Helper function
function sendSlackMessage (webhookURL, messageBody) {
    // make sure the incoming message body can be parsed into valid JSON
    try {
      messageBody = JSON.stringify(messageBody);
    } catch (e) {
      throw new Error('Failed to stringify messageBody', e);
    }
  
    // Promisify the https.request
    return new Promise((resolve, reject) => {
      // general request options, we defined that it's a POST request and content is JSON
      const requestOptions = {
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        }
      };
  
      // actual request
      const req = https.request(webhookURL, requestOptions, (res) => {
        let response = '';
  
        res.on('data', (d) => {
          response += d;
        });
  
        // response finished, resolve the promise with data
        res.on('end', () => {
          resolve(response);
        })
      });
  
      // there was an error, reject the promise
      req.on('error', (e) => {
        reject(e);
      });
  
      // send our message body (was parsed to JSON beforehand)
      req.write(messageBody);
      req.end();
    });
  }

// Main trigger function that is invoked by the Azure Function framework.
module.exports = async function (context, req) {

    context.log('HTTP trigger function received a request.');

    const https = require('https');
    const yourWebHookURL = process.env.SLACK_WEBHOOK_URL

    // Handle POST of data from Pulumi and send it to Slack
    if  (req.body) {
        
      // Parse the request and get the important bits out for sending to Slack
      const eventKind = req.headers["pulumi-webhook-kind"] // update, preview, destroy 
      const user = req.body["user"]["name"]
      const projectName = req.body["projectName"]
      const stackName = req.body["stackName"]
      const kind = req.body["kind"]  // update or destroy 
      const result = req.body["result"]
      const resourceChanges = req.body["resourceChanges"] ? JSON.stringify(req.body["resourceChanges"]) : ""
      // Build the slack text and the webhook message body.
      // See the following link for how to make it pretty: https://api.slack.com/messaging/webhooks#advanced_message_formatting 
      const slackText = `User: ${user}\n
      Project: ${projectName}\n
      Stack: ${stackName}\n
      Action: ${eventKind}\n
      Resource Changes: ${resourceChanges}\n
      Result: ${result}`

      // Use this to dump all the stuff that the webhook sends to figure out which fields you want to
      // use
      //const slackText = `{ ${json.STRINGIFY(req.headers)}, ${json.STRINGIFY(req.body)} }`

      const slackNotification = {
        'username': 'Pulumi stack event', // This will appear as user name who posts the message
        'text': slackText,
        'icon_emoji': ':bangbang:', // User icon, you can also use custom icons here
        'attachments': [{ // this defines the attachment block, allows for better layout usage
          'color': '#eed140', // color of the attachments sidebar.
          'fields': [ // actual fields
            {
              'title': 'Project', // Custom field
              'value': projectName, // Custom value
              'short': true // long fields will be full width
            },
            {
              'title': 'Stack',
              'value': stackName,
              'short': true
            }
          ]
        }]
      };
      

      // main
      (async function () {
        if (!yourWebHookURL) {
          context.log.error('No webhook provided.');
        }
      
        context.log('Sending slack message');
        try {
          const slackResponse = await sendSlackMessage(yourWebHookURL, slackNotification);
          context.log('Message response', slackResponse);
        } catch (e) {
          context.log.error('There was a error with the request', e);
        }
      })();

      context.res = {
          // status: 200, /* Defaults to 200 */
          body: "Successfully sent message to Slack Web Hook"
      };
    }
    else {
        context.res = {
            status: 400,
            body: "No message body received."
        };
    }
};
