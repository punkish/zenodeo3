import { resources } from '../../../data-dictionary/resources.js';
import { dispatch as ddutils } from '../../../data-dictionary/dd-utils.js';

import * as utils from '../../../lib/routeUtils.js';

const resourceName = 'treatmentImages';
const resource = resources.filter(r => r.name === resourceName)[0];

const options = utils.routeOptions(resource);
options.schema.querystring = ddutils.getSchema(resourceName);
options.handler = utils.routeHandler(resourceName);

export async function route(fastify, opts) {
    fastify.route(options)
}