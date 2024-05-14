"""A Python Pulumi program"""

import pulumi
import pulumi_databricks as pdb
from base64 import b64encode

# Get the authenticated user's workspace home directory path and email address.
# See https://www.pulumi.com/registry/packages/databricks/api-docs/getcurrentuser
user_home_path     = pdb.get_current_user().home
user_email_address = pdb.get_current_user().user_name

# Config values
config = pulumi.config.Config()
resource_prefix = config.require('resource-prefix')
node_type = config.require('node-type')

# Get the authenticated user's workspace home directory path and email address.
# See https://www.pulumi.com/registry/packages/databricks/api-docs/getcurrentuser
user_home_path     = pdb.get_current_user().home
user_email_address = pdb.get_current_user().user_name

# Create a Notebook resource.

notebook_base_path = "Pulumi"
notebook_path = f"{user_home_path}/{notebook_base_path}/{resource_prefix}-notebook.py"

notebook = pdb.Notebook(
  resource_name  = f"{resource_prefix}-notebook",
  path           = notebook_path,
  language       = 'PYTHON',
  content_base64 = b64encode(b"display(spark.range(10))").decode("UTF-8"),
)

# Export the URL of the Notebook, so that you can easily browse to it later.
# See https://www.pulumi.com/docs/intro/concepts/stack/#outputs
pulumi.export('Notebook URL', notebook.url)

# Create a Job resource.
job = pdb.Job(
  resource_name = f"{resource_prefix}-job",
  name = f"{resource_prefix}-job",
  tasks = [
    pdb.JobTaskArgs(
      task_key = f"{resource_prefix}-task",
      new_cluster   = pdb.JobNewClusterArgs(
        num_workers   = 1,
        spark_version = "14.3.x-scala2.12",
        node_type_id  = node_type
      ),
      notebook_task = pdb.JobNotebookTaskArgs(
        notebook_path = notebook.path
      )
    )
  ],
  email_notifications = pdb.JobEmailNotificationsArgs(
    on_successes = [ user_email_address ],
    on_failures  = [ user_email_address ]
  ),
)

# Export the URL of the Job, so that you can easily browse to it later.
# See https://www.pulumi.com/docs/intro/concepts/stack/#outputs
pulumi.export('Job URL', job.url)