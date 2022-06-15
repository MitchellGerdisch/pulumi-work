
// import { IncomingWebhook, IncomingWebhookSendArguments } from "@slack/webhook";
// import { formatSlackMessage } from "./util"

https = require('https');

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

module.exports = async function (context, req) {

    context.log('HTTP trigger function processed a request.');

    // Handle POST of data from Pulumi and send it to Slack
    if  (req.body) {
        const https = require('https');

        const yourWebHookURL = 'https://hooks.slack.com/services/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'; 
        const userAccountNotification = {
          'username': 'Error notifier', // This will appear as user name who posts the message
          'text': 'User failed to login 3 times. Account locked for 15 minutes.', // text
          'icon_emoji': ':bangbang:', // User icon, you can also use custom icons here
          'attachments': [{ // this defines the attachment block, allows for better layout usage
            'color': '#eed140', // color of the attachments sidebar.
            'fields': [ // actual fields
              {
                'title': 'Environment', // Custom field
                'value': 'Production', // Custom value
                'short': true // long fields will be full width
              },
              {
                'title': 'User ID',
                'value': '331',
                'short': true
              }
            ]
          }]
        };
        
        /**
         * Handles the actual sending request. 
         * We're turning the https.request into a promise here for convenience
         * @param webhookURL
         * @param messageBody
         * @return {Promise}
         */
        
        
        // main
        (async function () {
          if (!yourWebHookURL) {
            context.log.error('Please fill in your Webhook URL');
          }
        
          context.log('Sending slack message');
          try {
            const slackResponse = await sendSlackMessage(yourWebHookURL, userAccountNotification);
            context.log('Message response', slackResponse);
          } catch (e) {
            context.log.error('There was a error with the request', e);
          }
        })();






        // context.log("processing body: " + JSON.stringify(req.body));
        // context.log("headers: " + JSON.stringify(req.headers));
        // const webhookKind = req.headers !== undefined ? req.headers["pulumi-webhook-kind"] : "";
        // context.log("webhookKind: " + webhookKind);
        // const payload = req.body.toString();
        // context.log("payload: " + payload);
        // const parsedPayload = JSON.parse(payload);
        // context.log("parsedPayload: " + parsedPayload);
        // const prettyPrintedPayload = JSON.stringify(parsedPayload, null, 2);

        // const webhook = new IncomingWebhook("https://hooks.slack.com/services/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");

        // const fallbackText = `Pulumi Service Webhook (\`${webhookKind}\`)\n` + "```\n" + prettyPrintedPayload + "```\n";
        // const messageArgs: IncomingWebhookSendArguments = {
        //     channel: "general",
        //     text: fallbackText,
        // };

        // // Format the Slack message based on the kind of webhook received.
        // const formattedMessageArgs = formatSlackMessage(webhookKind, parsedPayload, messageArgs);

        // await webhook.send(formattedMessageArgs);

        context.res = {
            // status: 200, /* Defaults to 200 */
            body: "Got a body 4"
        };
    }
    else {
        context.res = {
            status: 400,
            body: "Expecting POST with request body"
        };
    }
};
