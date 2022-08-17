# Flask Self-Service Portal using Pulumi Automation API
Flask-based self-service portal to deploy Pulumi stacks.

## References
* [Flask Tutorial](https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-i-hello-world)
  * Big shout out to this tutorial for walking through a very complete Flask example.
* [Pulumi](https://pulumi.com)

# Flask Notes
* Pretty simple structure:
  * Main page lists current stacks
  * Deploy page allows you to deploy a new stack.
  * TODO: Add rendering of stack progress
* Calls pulumi automation api programs to do things and get things

# Pulumi Notes
* Local workspace based model - colocated under `pulumi/projects`
* automation api code under `pulumi/automation`