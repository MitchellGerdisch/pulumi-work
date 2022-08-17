import os

class Config(object):
  # used by flask-wtf web forms for he hidden_tag() stuff to protect against CSRF attacks - not really a concern for my little local service, but hey ....
  SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'