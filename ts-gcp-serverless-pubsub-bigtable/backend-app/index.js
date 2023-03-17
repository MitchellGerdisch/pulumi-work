// Imports the Google Cloud client library
const {Bigtable} = require('@google-cloud/bigtable');

// Instantiates a client
const bigtable = new Bigtable();

// Define and export an event handler
exports.backendFunction = (eventData, context, callback) => {
  // The eventData argument represents the event data payload
  decodedEvent = atob(eventData).data
  timestamp = decodedEvent.timestamp
  message = decodedEvent.message

  console.log("eventData:", eventData)
  console.log("timestamp:", timestamp)
  console.log("message:", message)
  // {"data": {"timestamp": "1679067925", "message": "Hello World"}}

  

  // Optionally signal function completion:
  callback();
};