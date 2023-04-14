# Flask Self-Service Portal for Pulumi Demos
A Flask-based front-end to serve up [pulumi demos](https://github.com/pulumi-demos/examples).  
Specifically, it integrates with the [automation API demo](https://github.com/pulumi-demos/examples/tree/main/python/automation-api)

This code implements the (arguably simple) Flask app to present and execute the pulumi stacks managed by the automation api code in the `pulumi-demos/examples` repo referenced above.
So the heavy lifting is left to the automation api code in the `pulumi-demos/examples` repo and this code just provides a thin layer on top to present it as a Flask app.

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
* Local workspace based model 

# How to Run
* `git clone` the examples repo
  * Modify `python/automation-api/arrangements.yaml` to provide the arrangements you want to demo.
* `export LAUNCHED_ARRANGEMENTS_FILE=./launched_arrangements.json && echo "{}" > $LAUNCHED_ARRANGEMENTS_FILE`
  * This initializes a file to use to store backup of launched arrangements info.
* `export AUTOMTION_API_DIR=XXXX`
  * Where `XXXX` is the full path to the pulumi demos `python/automation-api` folder.
* `export PYTHONPATH=$PYTHONPATH:$PROJECTS_DIR/utils`
* `python3 -m venv venv && source ./venv/bin/activate && pip install -r requirements.txt`
* `flask run`
* Point browser at provide link.
  * Use Deploy to deploy arrangements
  * Use Destroy to destroy arrangements.
    * NOTE: The destroy stuff is pretty fragile. If Flask crashes you currently lose the list of deployed arrangements.

## Settings Files
### .flaskenv  
* `FLASK_APP=flaskapp` - tells it to run the code in the `flaskapp` folder.
* `FLASK_DEBUG=1` - automatically reloads the web page when code changes.

### .env
* set `FLASK_PULUMI_ORG=` in the `.env` file to default the Pulumi Organization used by the self-service portal.