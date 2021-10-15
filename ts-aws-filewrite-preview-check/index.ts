import * as aws from "@pulumi/aws";
import * as pulumi  from "@pulumi/pulumi";
import * as fs from 'fs'

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("my-bucket");

// To write the bucket's property, I need to use .apply() which basically tells Pulumi to wait for the value and then
// apply some logic to it - in this case writing to a file.
// ONLY calls functionon actual pulumi up and not during previews.
// Without this conditional, the file gets written on every preview since functions are run during previews.
if (!pulumi.runtime.isDryRun()) {
  bucket.id.apply(id => writeEnvProp("MY_BUCKET_ID",id))
}

/////// helper function //////
// Could be in a separate module file.
function writeEnvProp(propName: string, prop: string) {
    const outString = `${propName}=${prop}`

    fs.writeFile('bucketId.txt', outString, (err) => {
        // throws an error, you could also catch it here
        if (err) throw err;
        // success case, the file was saved
        console.log(`${outString} saved!`);
    });
};
