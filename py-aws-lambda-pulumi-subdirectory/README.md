# Python lambda example with pulumi infra in a subdirectory

A rather specific use-case to demonstrate the following:
* I have lambda code (python) at the top of a directory. 
* The lambda code includes the need to install and use certain python packages.
* I want to add a subdirectory in which I define Pulumi code to deploy that lambda.
