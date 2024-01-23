# Python lambda example with pulumi infra in a subdirectory

A rather specific use-case to demonstrate the following:
* I have lambda code (python) at the top of a directory. 
* The lambda code includes the need to install and use certain python packages.
* I want to add a subdirectory in which I define Pulumi code to deploy that lambda.

## REFERENCES
AWS doc on packaging python dependencies: 
* https://docs.aws.amazon.com/lambda/latest/dg/python-package.html
  * USING the `To create the deployment package (project directory)` approach described in that document.

## Setting up the lambda app packages
* `mkdir hello-packages`
* `pip install -r hello-requirements.txt --target ./hello-packages`

The Pulumi program will zip this up with the application for pushing to lambda.


