import { resources } from '../../../data-dictionary/resources.js';
import * as utils from '../../../lib/utils.js';
import { dispatch as ddutils } from '../../../data-dictionary/dd-utils.js';

const name = 'treatmentImages';
const resource = resources.filter(r => r.name === name)[0];

const options = utils.routeOptions(resource);
options.schema.querystring = ddutils.getSchema(name);
options.handler = async (request, reply) => {
    return { 
        bibRefCitationId: request.query.bibRefCitationId,
        version: request.query.version,
        communities: request.query.communities
    }
}

export async function route(fastify, opts) {
    fastify.route(options)
}