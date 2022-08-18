from pydoc import render_doc
from flask import render_template, flash, redirect, url_for
from app import app
from app.forms import StackDeployForm
import sys
sys.path.append('/pulumi/automation')
import stack_utils

@app.route('/')
@app.route('/index')
def index():
    user = {'username': 'Mitch'}
    stacks = [
        {
            'name': "myorg/myproject/dev",
            'outputs' : [
                {
                    'outputname': "myoutput",
                    'outputvalue': "boo"
                },
                {
                    'outputname': "myotheroutput",
                    'outputvalue': "zoo"

                }
            ]
        },
        {
            'name': "myorg/myproject/prod",
            'outputs' : [
                {
                    'outputname': "myoutput",
                    'outputvalue': "goo"
                },
                {
                    'outputname': "myotheroutput",
                    'outputvalue': "moo"

                }
            ]
        }
    ]
    return render_template('index.html', title="Pulumi Self-Service", user=user, stacks=stacks)

@app.route('/deploy', methods=['GET', 'POST'])
def deploy():
    form = StackDeployForm()
    if form.validate_on_submit():
        flash('Accepted request to deploy stack: {}/{}/{}'.format(form.org.data, form.project.data, form.stack.data))

        return redirect(url_for('index'))
    return render_template('deploy.html', title="Deploy Stack", form=form)