import { resources } from '../../../data-dictionary/resources.js';
import * as utils from '../../../lib/utils.js';
import { dispatch as ddutils } from '../../../data-dictionary/dd-utils.js';

const name = 'etlStats';
const resource = resources.filter(r => r.name === name)[0];

const options = utils.routeOptions(resource);
options.schema.querystring = ddutils.getSchema(name);
console.log(options.schema.querystring)
options.handler = async (request, reply) => {
    return {}
}

export async function route(fastify, opts) {
    fastify.route(options)
}