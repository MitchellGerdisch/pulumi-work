# Python lambda example with pulumi infra in a subdirectory

A rather specific use-case to demonstrate the following:
* I have lambda code (python) at the top of a directory. 
* The lambda code includes the need to install and use certain python packages.
* I want to add a subdirectory in which I define Pulumi code to deploy that lambda.

## REFERENCES
AWS doc on packaging python dependencies: 
* https://docs.aws.amazon.com/lambda/latest/dg/python-package.html
  * USING the `To create the deployment package (project directory)` approach described in that document.

Pulumi Docs on Assets and Archives:
* https://www.pulumi.com/docs/concepts/inputs-outputs/assets-archives/ 
  * See pulumi/__main__.py where this stuff is used to build the archive to send the code and dependencies to Lambda.

## Setting up the lambda app packages
* `mkdir hello-packages`
* `pip install -r hello-requirements.txt --target ./hello-packages`
* Update the pulumi program to point at the applicable package folders that were populated in hello-packages.



