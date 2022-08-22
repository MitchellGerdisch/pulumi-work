from flask import Flask
from flask_bootstrap import Bootstrap

app = Flask(__name__)
app.config.from_mapping(
        SECRET_KEY="not-very-secret",
)
bootstrap = Bootstrap(app)

from flaskapp import routes
