import { routeFactory } from '../../lib/routeUtils.js';
import { resources } from '../../data-dictionary/resources/index.js';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;

/**
 * create the root route
 * @param {string} resource - name of the resource.
 */
//const createRootRoute = (resource) => {
const rootRoute = async function (fastify, opts) {
        const options = {
            method: 'GET',
            url: '/',
            schema: {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                "$id": "https://example.com/root.schema.json",
                title: "API root",
                summary: "This is where it starts",
                description: "This is the root of the Zenodeo API",
                response: {},
                querystring: {},
                tags: [ 'zenodeo' ]
            },
            handler: async (request, reply) => {
                return Object.values(Object.fromEntries(fastify.routes))
                    .flat(1)
                    .filter(a => a.schema.tags)
                    .map(a => {
                        return {
                            title: a.schema.title,
                            summary: a.schema.summary,
                            description: a.schema.description,
    
                            //
                            // usually no url fragments in config have either 
                            // leading or trailing slashes EXCEPT those
                            // returned by `fastify.routes`. That is why there 
                            // is no slash in the setting below because 
                            // `a.url` already contains a leading slash
                            //
                            url: `${config.url.zenodeo}${a.url}`
                        }
                    });
            }
        };
    
        fastify.route(options);
    };
//}

const xmlRoute = async function (fastify, opts) {
    const options = {
        method: 'GET',
        url: '/treatments-archive/',
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://example.com/root.schema.json",
            title: 'xml',
            summary: 'treatment xml',
            description: 'treatment xml',
            response: {},
            querystring: {},
            tags: [ 'zenodeo' ]
        },
        handler: async (request, reply) => {
            return request.pathname
        }
    };

    fastify.route(options);
};

const routes = resources
    .map(resource => routeFactory(resource.name));

routes.push(xmlRoute);
routes.unshift(rootRoute);
export { routes }