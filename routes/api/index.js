import { routeFactory } from '../../lib/routeUtils.js';
import { resources } from '../../data-dictionary/resources.js';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;

/**
 * create the root route
 */
const createRoot = (resources) => {
    const name = 'root';
    const resource = resources.filter(r => r.name === name)[0];

    const options = {
        method: 'GET',
        url: '/',
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://example.com/root.schema.json",
            title: resource.title,
            summary: resource.summary,
            description: resource.description,
            response: {},
            querystring: {},
            tags: resource.tags
        }
    };

    return async function (fastify, opts) {
        options.handler = async (request, reply) => {
            return Object.values(Object.fromEntries(fastify.routes))
                .flat(1)
                .filter(a => a.schema.tags)
                .map(a => {
                    return {
                        title: a.schema.title,
                        summary: a.schema.summary,
                        description: a.schema.description,

                        /**
                         * usually no url fragments in config have either 
                         * leading or trailing slashes EXCEPT those returned 
                         * by `fastify.routes`. That is why there is no 
                         * slash in the setting below because `a.url` already 
                         * contains a leading slash
                        **/
                        url: `${config.url.zenodeo}${a.url}`
                    }
                });
        };
    
        fastify.route(options);
    };
}

const root = createRoot(resources);

const routes = resources
    .filter(resource => resource.name !== 'root')
    .map(resource => routeFactory(resource.name));

routes.unshift(root);
export { routes }