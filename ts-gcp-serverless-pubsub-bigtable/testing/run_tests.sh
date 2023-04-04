# list of folders in this directory containing policy-as-code "test" policy-packs
TESTDIRS=("frontend-component")

for testdir in ${TESTDIRS[@]}; do
  echo "Running $testdir tests"
  pulumi preview --cwd ../single-project --policy-pack "`pwd`/${testdir}"
done
