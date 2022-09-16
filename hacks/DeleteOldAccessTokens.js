/* 
 * This script deletes:
 * - Access tokens owned by the user as identified by the provided access token.
 * (A bit meta, but the access token parameter is used to delete access tokens owned by the access token [parameter] owner
 * that are older than the given number of days or the default number of days.)
 * 
 * Parameters
 * accessToken - Pulumi user access token used to talk to the Pulumi API.
 * age - (optional) override default age in days to delete
 * 
 * Example:
 * DeleteEmptyStacks("MyOrgName","pul-12345566", 10)
 * Will delete any stacks that have not been updated and
 * any stacks that haven't been updated for 10 or more days.
 */


async function DeleteUserAccessTokens(accessToken, age) {

    // Tokens that haven't been used for more than this number of days ago are deleted.
    ageDays = 30

    if (((accessToken == null) || (accessToken == ""))) {
        console.log("***** USAGE ******")
        console.log("***** DeleteAccessTokens(\"PULUMI_ACCESS_TOKEN\"")
        console.log(`***** This script will delete access tokens that have not been used for over ${ageDays} ago.`)
        console.log("")
        return
    }

    if (age !=null) {
        ageDays = age
    }

    response = await fetch(`https://api.pulumi.com/api/user/tokens`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'authorization': `token ${accessToken}`
        }
    })

    resp = await response.json()
    tokens = resp.tokens

    for (token of tokens) {
        tokenId = token.id
        tokenDesc = token.description
        deleteable = false
        if (!token.hasOwnProperty('lastUsed')) {
            deleteable = true
        } else {
            ageSeconds = ageDays * (60 * 60 * 24)
            tokenLastUsedTime = token.lastUsed
            nowTime = Math.round(Date.now()/1000) // bring down to seconds
            age = nowTime - tokenLastUsedTime 
            if (age > ageSeconds) {
                deleteable = true
            }
        } 
        if (deleteable) {
            // Delete the token
            await deleteToken(tokenId, accessToken)
        } else {
            console.log("Keeping: ", tokenDesc)
        }
    }
}

async function deleteToken(tokenId, accessToken) {
    console.log("Deleting: ", tokenId)
    delResp = await fetch(`https://api.pulumi.com/api/user/tokens/${tokenId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'authorization': `token ${accessToken}`,
        }
    })
}