from pydoc import render_doc
from flask import render_template, flash, redirect, url_for
from flaskapp import app
from flaskapp.forms import StackDeployForm, StackDestroyForm
from pulumi_orch.automate.stack_utils import update_stack, get_existing_deployments
from pulumi_orch.automate.project_utils import get_deployment_options

@app.route('/current')
def current():
    current_active_stacks=[]
    return render_template('current.html', title="Pulumi Self-Service", stacks=current_active_stacks)

@app.route('/', methods=['GET', 'POST'])
@app.route('/deploy', methods=['GET', 'POST'])
def deploy():
    deployment_options = get_deployment_options()
    # flash(f'Found projects: {deployment_options}') 
    form = StackDeployForm()
    form.deployment_option.choices = deployment_options
    # Since projects is dynamic, need to add in the values to the form before processing
    if form.validate_on_submit():
        org = form.org.data
        deployment_option = form.deployment_option.data
        env = form.env.data
        # flash('Accepted request to deploy environment: {}, {}, {}'.format(org, deployment_option, env))
        stacks_results = update_stack(org, deployment_option, env, False)
        # flash(f'stack_results: {stacks_results}')
        return render_template('current.html', title="Pulumi Self-Service", stacks_results=stacks_results)
    return render_template('deploy.html', title="Deploy Stack", form=form)

@app.route('/destroy', methods=['GET', 'POST'])
def destroy():
    # flash(f'Found projects: {deployment_options}') 
    existing_deployments = get_existing_deployments()
    form = StackDestroyForm()
    form.existing_deployments.choices = existing_deployments
    # Since is dynamic, need to add in the values to the form before processing
    if form.validate_on_submit():
        org = form.org.data
        existing_deployment = form.existing_deployments.data
        selection_split = existing_deployment.split("/")
        deployment = selection_split[0]
        stack = selection_split[-1]
        # flash('Accepted request to deploy environment: {}, {}, {}'.format(org, deployment_option, env))
        destroy_result = update_stack(org, deployment, stack, True)
        # flash(f'stack_results: {stacks_results}')
        return render_template('current.html', title="Pulumi Self-Service", stacks_results=destroy_result)
    return render_template('destroy.html', title="Destroy Stack", form=form)


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