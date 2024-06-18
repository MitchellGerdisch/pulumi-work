# Deploy Wordpress to AWS EC2 using Pulumi and Ansible - TWEAKED

This is a slightly modified version of https://github.com/pulumi/examples/tree/master/aws-py-ansible-wordpress 

It autocreates the ssh keys and allows defaults for db user and password, etc.

This project demonstrates how to use Pulumi and Ansible together. Pulumi handles provisioning the AWS infrastructure
required to run Wordpress on an EC2 instance, with an RDS MySQL database, running inside of a VPC with proper public
and private subnets, and exposed to the Internet using an Elastic IP address. Ansible handles configuring the EC2
virtual machine after it's been provisioned with a playbook that knows how to install and configure Wordpress.
The entire deployment is orchestrated by Pulumi in a single `pulumi up` thanks to the
[Command package](https://www.pulumi.com/registry/packages/command) which runs a combination of local and remote SSH
commands to accomplish the desired effect. The result is repeatable automation that both provisions and configures.
