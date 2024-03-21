import json

def handler(event, context):
    return {
        "statusCode": 200,
        "body": json.dumps('BLUE BLUE BLUE!!')
    }
