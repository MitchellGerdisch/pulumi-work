/* 
 * This script counts the current number of resources managed by the Pulumi service.
 * 
 * Parameters
 * orgName - Pulumi organization name
 * accessToken - Pulumi user access token
 * 
 * Example:
 * - Open developer tools Javascript Console
 * - Copy/Paste the javascript in this file to the Javascript Console
 * - Run `CountResources("MyOrgName","pul-12345566")`
 */


async function CountResources(orgName, accessToken) {

    if (((orgName == null) || (orgName == "")) || ((accessToken == null) || (accessToken == ""))) {
        console.log("***** USAGE ******")
        console.log("***** CountResources(\"ORGANIZATION_NAME\", \"PULUMI_ACCESS_TOKEN\"")
        console.log("")
        return
    }

    response = await fetch(`https://api.pulumi.com/api/console/orgs/${orgName}/repos`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'authorization': `token ${accessToken}`
        }
    })

    resp = await response.json()
    repos = resp.repositories

    totalResources = 0
    for (repo of repos) {
        for (project of repo.projects) {
            projectName = project.name
            for (stack of project.stacks) {
                stackName = stack.name
                fullStack = `${orgName}/${projectName}/${stackName}`
                // If the stack has no lastUpdate then it means it's an initialized, undeployed (i.e. empty stack)
                if (stack.hasOwnProperty('lastUpdate')) {
                    totalResources = totalResources + stack.lastUpdate.resourceCount
                } 
            }
        }
    }
    console.log("### Total Resource Count: "+totalResources)
}