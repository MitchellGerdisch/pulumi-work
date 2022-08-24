from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired, InputRequired
import os

class StackDeployForm(FlaskForm):
    default_org = os.getenv("FLASK_PULUMI_ORG")
    org = StringField('Organization', default=default_org, validators=[DataRequired()])
    deployment_option = SelectField('Deployment Options', validators=[InputRequired()])
    env = StringField('Environment Name', validators=[DataRequired()])
    submit = SubmitField('Deploy Stack')

class StackDestroyForm(FlaskForm):
    default_org = os.getenv("FLASK_PULUMI_ORG")
    org = StringField('Organization', default=default_org, validators=[DataRequired()])
    existing_deployments = SelectField('Existing Environments', validators=[InputRequired()])
    submit = SubmitField('Destroy Stack')