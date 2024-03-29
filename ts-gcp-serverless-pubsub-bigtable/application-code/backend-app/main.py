import base64
import datetime
import json
import os
from google.cloud import bigtable 


GOOGLE_PROJECT_ID = os.getenv('GOOGLE_PROJECT_ID')
BIGTABLE_INSTANCE_ID = os.getenv('BIGTABLE_INSTANCE_ID')
BIGTABLE_TABLE_ID = os.getenv('BIGTABLE_TABLE_ID')
BIGTABLE_COLUMN_FAMILY = os.getenv('BIGTABLE_COLUMN_FAMILY')

def process_pubsub_event(event, context):

    message = base64.b64decode(event['data']).decode('utf-8')
    payload = json.loads(message)["data"]

    event_id = context.event_id
    event_type = context.event_type

    print(f"A new event is received: id={event_id}, type={event_type}")
    print(f"data = {message}")
    print(f"payload = {json.dumps(payload)}")

    print(f"PROJECT_ID: {GOOGLE_PROJECT_ID}; TABLE_INSTANCE: {BIGTABLE_INSTANCE_ID}; TABLE: {BIGTABLE_TABLE_ID}, COLUMN_FAMIL: {BIGTABLE_COLUMN_FAMILY}")

    # Create a Cloud Bigtable client.
    client = bigtable.Client(project=GOOGLE_PROJECT_ID, admin=True)
    # Connect to an existing Cloud Bigtable instance.
    instance = client.instance(BIGTABLE_INSTANCE_ID)
    # Open an existing table.
    table = instance.table(BIGTABLE_TABLE_ID)

    table_timestamp = datetime.datetime.utcnow()
    column_family_id = BIGTABLE_COLUMN_FAMILY

    row_key = payload["timestamp"]
    row = table.direct_row(row_key)
    row.set_cell(column_family_id, "message", payload["message"], table_timestamp)
    row.commit()


    