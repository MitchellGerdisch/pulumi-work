from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired, InputRequired

class StackDeployForm(FlaskForm):
    org = StringField('Organization', validators=[DataRequired()])
    project = SelectField('Project', validators=[InputRequired()])
    stack = StringField('Stack', validators=[DataRequired()])
    submit = SubmitField('Deploy Stack')
