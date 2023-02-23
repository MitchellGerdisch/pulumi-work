if [ $# -lt 2 ]; then
  echo "usage: $0 PULUMI_PROJECT_NAME PULUMI_CONFIG_FILE"
  exit 1
fi
python3 -m venv venv
source venv/bin/activate
PROJECT_NAME=${1}
CONFIG_FILE=${2}

# This only works for config that has no secrets
# export PULUMI_CONFIG=$(yq eval ${CONFIG_FILE} --output-format=json | jq -c '.config' | sed "s/${PROJECT_NAME}/project/g")
# echo $PULUMI_CONFIG | jq "."

## This uses a little python program to process a config with secrets.
# Infer the stack name from the passed in config file name
STACK_NAME=$(echo $CONFIG_FILE | sed "s/.*Pulumi\.//g" | cut -d. -f1)
pulumi_config=$(pulumi config --json --show-secrets --stack $STACK_NAME)
new_config=`python ./process_config.py -c "$pulumi_config"`
# Same basic logic as the no secrets example above, but now processing the new_config which supports secrets.
export PULUMI_CONFIG=$(echo ${new_config} | sed "s/${PROJECT_NAME}/project/g")
echo $PULUMI_CONFIG | jq "."

echo '\nHit enter to run "python -m unittest"'
read n
echo '\nRunning "python -m unittest" ...'
python -m unittest 
echo "\n*****************\n"
echo '\nHit enter to run "pytest"'
read n
echo '\nRunning "pytest" ...'
pytest --disable-pytest-warnings