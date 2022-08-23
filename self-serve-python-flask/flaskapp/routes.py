from pydoc import render_doc
from flask import render_template, flash, redirect, url_for
from flaskapp import app
from flaskapp.forms import StackDeployForm
from pulumi_orch.automate.stack_utils import update_stack
from pulumi_orch.automate.project_utils import get_deployment_options

@app.route('/current')
def current():
    current_active_stacks=[]
    return render_template('current.html', title="Pulumi Self-Service", stacks=current_active_stacks)

@app.route('/', methods=['GET', 'POST'])
@app.route('/deploy', methods=['GET', 'POST'])
def deploy():
    # Build list of projects to make available for selection on the form.
    # Format: [("returnedData", "displayName"), ...]
    # TO-DO: Dynamically build this or otherwise manage the list elsewhere.
    # The first value in each pair is the value passed as data, second value is the displayed value. 
    # The passed value is use to find the project's folder. 
    # The second value is really just for display purposes but probalby should match the actual project name.
    deployment_options = get_deployment_options()
    # flash(f'Found projects: {deployment_options}') 
    form = StackDeployForm()
    form.deployment_option.choices = deployment_options
    # Since projects is dynamic, need to add in the values to the form before processing
    if form.validate_on_submit():
        org = form.org.data
        deployment_option = form.deployment_option.data
        env = form.env.data
        destroy = form.destroy.data
        # flash('Accepted request to deploy environment: {}, {}, {}'.format(org, deployment_option, env))
        stacks_results = update_stack(org, deployment_option, env, destroy)
        # flash(f'stack_results: {stacks_results}')
        return render_template('current.html', title="Pulumi Self-Service", stacks_results=stacks_results)
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