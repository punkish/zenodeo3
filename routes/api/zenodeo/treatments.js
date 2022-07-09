import { resources } from '../../../data-dictionary/resources.js';
import { dispatch as ddutils } from '../../../data-dictionary/dd-utils.js';

import * as utils from '../../../lib/routeUtils.js';

const resourceName = 'treatments';
const resource = resources.filter(r => r.name === resourceName)[0];

const options = utils.routeOptions(resource);
const queryStringSchema = ddutils.getSchema(resourceName);
options.schema.querystring.properties = queryStringSchema;
options.handler = utils.routeHandler(resourceName);

export async function route(fastify, opts) {
    fastify.route(options);
}