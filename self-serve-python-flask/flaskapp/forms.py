from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired

class StackDeployForm(FlaskForm):
    org = StringField('Organization', validators=[DataRequired()])
    project = StringField('Project', validators=[DataRequired()])
    stack = StringField('Stack', validators=[DataRequired()])
    submit = SubmitField('Deploy Stack')
