const resourceName = 'figureCitations';

import { resources } from '../../../data-dictionary/resources.js';
import { routeOptions } from '../../../lib/routeUtils.js';

const options = routeOptions(resources.filter(r => r.name === resourceName)[0]);

export async function route(fastify, opts) {
    fastify.route(options);
}