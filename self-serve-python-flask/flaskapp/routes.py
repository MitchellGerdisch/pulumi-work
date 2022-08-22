from pydoc import render_doc
from flask import render_template, flash, redirect, url_for
from flaskapp import app
from flaskapp.forms import StackDeployForm
from pulumi_orch.automate.stack_utils import update_stack

@app.route('/')
@app.route('/index')
def index():
    stacks=[]
    return render_template('index.html', title="Pulumi Self-Service", stacks=stacks)

@app.route('/deploy', methods=['GET', 'POST'])
def deploy():
    # Build list of projects to make available for selection on the form.
    # TO-DO: Dynamically build this or otherwise manage the list elsewhere.
    # NOTE: The first value is each pair is the value passed as data, second value is the displayed value. 
    # The passed value is use to find the project's folder. 
    # The second value is really just for display purposes but probalby should match the actual project name.
    projects = [("test-project", "selfserve-test-project"), ("test-project-2-not-available", "selfserve-test-project-2")]
    form = StackDeployForm()
    form.project.choices = projects
    # Since projects is dynamic, need to add in the values to the form before processing
    if form.validate_on_submit():
        org = form.org.data
        project = form.project.data
        stack = form.stack.data
        flash('Accepted request to deploy stack: {}/{}/{}'.format(org, project, stack))
        stacks = [update_stack(org, project, stack, False)]
        return render_template('index.html', title="Pulumi Self-Service", stacks=stacks)
    return render_template('deploy.html', title="Deploy Stack", form=form)


    #     stacks = [
    #     {
    #         'name': "myorg/myproject/dev",
    #         'outputs' : [
    #             {
    #                 'outputname': "myoutput",
    #                 'outputvalue': "boo"
    #             },
    #             {
    #                 'outputname': "myotheroutput",
    #                 'outputvalue': "zoo"

    #             }
    #         ]
    #     },
    #     {
    #         'name': "myorg/myproject/prod",
    #         'outputs' : [
    #             {
    #                 'outputname': "myoutput",
    #                 'outputvalue': "goo"
    #             },
    #             {
    #                 'outputname': "myotheroutput",
    #                 'outputvalue': "moo"

    #             }
    #         ]
    #     }
    # ]