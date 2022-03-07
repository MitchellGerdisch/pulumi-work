# Experimenting with Pulumi Unit Testing and Configuration Files
Currently as per this issue: https://github.com/pulumi/pulumi/issues/4472   
Unit testing does not natively handle Pulumi configuration files (e.g. Pulumi.dev.yaml).  
So, one needs to build out a PULUMI_CONFIG environment variable for the unit tests to use.  

This example (leveraging ideas from https://github.com/pulumi/pulumi/issues/8217) shows how to do this.

# Useful links
Good introductory Python unit testing example: https://github.com/pulumi/examples/tree/master/testing-unit-py

Example of using unittest framework to run integration test:
https://github.com/pulumi/examples/tree/master/testing-integration-py 

# Set Up
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

# To Use
Pass `Pulumi.test_pass.yaml` to the script (see below) to see a test pass.  
Use `Pulumi.test_fail.yaml` to see a test fail.  

d
Then run:
```bash
chmod +x run_test.sh 
run_test.sh PROJECT_NAME CONFIG_FILE
```

Where PROJECT_NAME is the name of the project as seen in the Pulumi.yaml file.

Where CONFIG_FILE is the name of the config file.

NOTE: `run_test.sh` runs both `python -m unittest` and `pytest` just to show the different styles of output.