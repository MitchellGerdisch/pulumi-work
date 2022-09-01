# Python + YAML + Multilanguage Component Example
Built off the "aws-py-ansible-wordpress" and "aws-yaml-ansible-wordpress" examples in the Pulumi examples repo.

But leverages the "wpinstance" multilanguage component found here: https://github.com/MitchellGerdisch/mlc-python-ec2_instance

# Set Up
## Get the Multilanguage Component Ready to Use
Clone the https://github.com/MitchellGerdisch/mlc-python-ec2_instance repo.
```bash
make generate
make build
make install
make dist
ls dist
```

Install the MLC plugin:
```bash
pulumi plugin install resource wpinstance VERSION --file dist/FILENAME
```
Where
* VERSION is the version seen in the name when you did `ls dist`
* FILENAME is the file that is appropriate for your workstation

## Create Stacks
### Python Project
NOTE: Make sure the `requirements.txt` file points to the correct path to the MLC Python SDK generated above.
```bash
cd aws-py-ansible-wordpress
python3 -m venv venv
source ./venv/bin/activate
pip install -r requirements.txt
```

Go through the README for the project for the steps to create the keys and config values and deploy the stack.

### YAML Project
```bash
cd aws-yaml-ansible-wordpress
pulumi stack init dev
pulumi up
```

