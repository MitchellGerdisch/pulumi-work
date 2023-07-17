import os
import json
from pydoc import render_doc
from flask import render_template, flash, redirect, url_for
from flaskapp import app
from flaskapp.forms import StackDeployForm, StackDestroyForm
from pulumi_demos_integration.automate.project_utils import get_deployment_options

## POINTS at utils under the automation API folder in the Pulumi-Demos/examples repo.
# See the README for setting up PYTHONPATH so this reference works.
# TODO: Make the reference more automatic
from utils.run_automation import run_automation
from utils.run_automation import gen_config_list

# Keep track of launched deployments
# TODO: Use the automation API arrangements and Pulumi cloud as a source of truth for current deployments.
def save_launched_arrangements(launched_arrangements_file, launched_arrangements):
    with open(launched_arrangements_file, "w") as fp:
        json.dump(launched_arrangements, fp)  
def get_launched_arrangements(launched_arrangements_file):
    with open(launched_arrangements_file, "r") as fp:
        return(json.load(fp))

launched_arrangements_file=os.getenv('LAUNCHED_ARRANGEMENTS_FILE')
launched_arrangements = get_launched_arrangements(launched_arrangements_file)

@app.route('/current')
def current():
    current_active_stacks=[]
    return render_template('current.html', title="Pulumi Self-Service", stacks=current_active_stacks)

@app.route('/', methods=['GET', 'POST'])
@app.route('/deploy', methods=['GET', 'POST'])
def deploy():
    autoapi_folder = os.getenv("AUTOMATION_API_DIR")
    arrangements_file = os.path.join(autoapi_folder, "arrangements.yaml")
    # TODO: Make the following line less hacky
    # But for now, it is assumed that the Pulumi Projects that are represented in `arragements.yaml` are found
    # a couple of levels up from the automation API code - which basically assumes the same.
    base_folder = os.path.join(autoapi_folder, "../..") 
    deployment_options = get_deployment_options(arrangements_file)
    # flash(f'Found projects: {deployment_options}') 
    form = StackDeployForm()
    form.deployment_option.choices = deployment_options
    # Since projects is dynamic, need to add in the values to the form before processing
    if form.validate_on_submit():
        org = form.org.data
        deployment_option = form.deployment_option.data
        env = form.env.data
        config = gen_config_list(form.config.data.split())
        # flash('Accepted request to deploy environment: {}, {}, {}'.format(org, deployment_option, env))
        stacks_results = run_automation(base_folder, arrangements_file, deployment_option, org, env, False, config) #update_stack(org, deployment_option, env, False)
        # flash(f'stack_results: {stacks_results}')
        launched_arrangements[deployment_option+"/"+env]={"base_folder": base_folder, "arrangements_file": arrangements_file, "org": org, "deployment_option": deployment_option, "env": env}
        # print("launched_arrangements", launched_arrangements)
        save_launched_arrangements(launched_arrangements_file, launched_arrangements)
        return render_template('current.html', title="Pulumi Self-Service", stacks_results=stacks_results)
    return render_template('deploy.html', title="Deploy Stack", form=form)

@app.route('/destroy', methods=['GET', 'POST'])
def destroy():
    # flash(f'Found projects: {deployment_options}') 
    existing_deployments = list(launched_arrangements.keys())
    form = StackDestroyForm()
    form.existing_deployments.choices = existing_deployments
    # Since is dynamic, need to add in the values to the form before processing
    if form.validate_on_submit():
        org = form.org.data
        existing_deployment = form.existing_deployments.data
        launched_info = launched_arrangements[existing_deployment]
        print("launched_info", launched_info)
        # selection_split = existing_deployment.split("/")
        # deployment = selection_split[0]
        # stack = selection_split[-1]
        # flash('Accepted request to deploy environment: {}, {}, {}'.format(org, deployment_option, env))
        destroy_result = run_automation(launched_info["base_folder"], launched_info["arrangements_file"], launched_info["deployment_option"], launched_info["org"], launched_info["env"], True, {}) #update_stack(org, deployment_option, env, False)
        # flash(f'stack_results: {stacks_results}')
        launched_arrangements.pop(existing_deployment)
        save_launched_arrangements(launched_arrangements_file, launched_arrangements)
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