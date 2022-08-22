from pydoc import render_doc
from flask import render_template, flash, redirect, url_for
from flaskapp import app
from flaskapp.forms import StackDeployForm
from pulumi.automation.stack_utils import update_stack

user = {'username': 'Mitch'}

@app.route('/')
@app.route('/index')
def index():
    stacks=[]
    return render_template('index.html', title="Pulumi Self-Service", user=user, stacks=stacks)

@app.route('/deploy', methods=['GET', 'POST'])
def deploy():
    form = StackDeployForm()
    if form.validate_on_submit():
        org = form.org.data
        project = form.project.data
        stack = form.stack.data
        flash('Accepted request to deploy stack: {}/{}/{}'.format(org, project, stack))
        stacks = [update_stack(org, project, stack, False)]
        return render_template('index.html', title="Pulumi Self-Service", user=user, stacks=stacks)
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