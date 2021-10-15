import * as pulumi from '@pulumi/pulumi';
import Vpc from './vpc';

const config = new pulumi.Config();
const name = config.require('namebase')

// basic call to vpc module and exporting what it exports
export const vpc = new Vpc(name, {
});
