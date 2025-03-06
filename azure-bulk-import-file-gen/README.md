# Azure Bulk Import File Generator

This is a script that can be used to process the output of `az resource list` to generate bulk import files for `pulumi import`.

# Usage
`python gen_bulk_import_file -r RESOURCE_LIST.json -o OUTPUT_IMPORT_FILE.json [-n NUMBER_OF_RESOURCES_PER_FILE]`

If it throws an error about not being able to find a Pulumi type in `type-mappings.json` then add an entry like the others in the file.
You can use the Azure-Native provider documentation to find the matching Pulumi type but navigating to the docs page for the given type of resource and then looking at the import section for the resource.
