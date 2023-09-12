# automation api code that configures deployment settings for a stack

You need to have a pre-existing stack. 
It does not have to have been deployed.
A stack that has simply been `pulumi stack init` is sufficient.

## Prep
- `python3 -m  venv venv`
- `source ./venv/bin/activate`
- `pip install -r requirements.txt`

## Run
- `python ./main.py`
