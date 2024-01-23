import json
import randfacts

def handler(event, context):
    randfact1 = randfacts.get_fact()
    return {
        "statusCode": 200,
        "body": json.dumps(f"Random fact: {randfact1}")
    }
