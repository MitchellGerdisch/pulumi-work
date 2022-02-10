if [ $# -lt 2 ]; then
  echo "missing parameters"
  exit 1
fi
python3 -m venv venv
source venv/bin/activate
PROJECT_NAME=${1}
CONFIG_FILE=${2}
export PULUMI_CONFIG=$(yq eval ${CONFIG_FILE} --output-format=json | jq -c '.config' | sed "s/${PROJECT_NAME}/project/g")
python -m unittest