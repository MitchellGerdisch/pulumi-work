import os
import time
import json

from google.cloud import pubsub_v1

# Get project id as env variable
GOOGLE_PROJECT_ID = os.getenv('GOOGLE_PROJECT_ID')
TOPIC_NAME = os.getenv('TOPIC_NAME')

# Instantiates a Pub/Sub client
publisher = pubsub_v1.PublisherClient()

# Publishes a message to a Cloud Pub/Sub topic.
def demo(request):
    """Simple API to write to pubsub"""

    # Get a timestamp to pass along 
    now = str(int(time.time()))
    # Get the `?message=XXXXX` parameter, if any, passed in the URL.
    message = request.args.get("message")
    if not message:
        message = "Hello World"

    print(f'Publishing to {TOPIC_NAME}: Timestamp: {now}; Message: {message}')

    # References an existing topic
    topic_path = publisher.topic_path(GOOGLE_PROJECT_ID, TOPIC_NAME)

    message_json = json.dumps({
        'data': {'timestamp': now,
                 'message': message},
    })
    message_bytes = message_json.encode('utf-8')

    # Publishes a message
    try:
        publish_future = publisher.publish(topic_path, data=message_bytes)
        publish_future.result()  # Verify the publish succeeded
        return "Pushed to '%s': Timestamp: '%s'; Message: '%s'" % (TOPIC_NAME, now, message)
    except Exception as e:
        print(e)
        return (e, 500)

    # return "Did not push to '%s': Timestamp: '%s'; Message: '%s'" % (TOPIC_NAME, now, message)
