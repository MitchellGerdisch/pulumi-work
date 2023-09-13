# automation api code that configures various Pulumi Cloud settings for a stack

This program runs through a set of stacks implied by the `stacks_base_properties.py` file along with the `tenant` argument.
For each stack, it does the following:
- Creates a Deployment setting for the stack.
- Creates a stack tag with the tenant's name.
  - Note: it also tags itself with the tenant's name
  - This allows one to go to the Pulumi Cloud UI Stacks page and select the `Group By` pull down to group the tenants' stacks together in the view.

## Prep
- `python3 -m  venv venv`
- `source ./venv/bin/activate`
- `pip install -r requirements.txt`

## Run
- `python ./main.py --help` to see the list of options.

## Testing
There is a `test_code.py` file containing code that can be used to create bunches of stacks to then run the code above against.

