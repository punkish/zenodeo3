import { route as treatments } from './zenodeo/treatments.js';
import { route as materialcitations } from './zenodeo/materialcitations.js';
import { route as images } from './zenodo/images.js';
import { route as publications } from './zenodo/publications.js';

/*
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
            "$id": "https://example.com/product.schema.json",
            name,
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
                        name: a.schema.name,
                        summary: a.schema.summary,
                        description: a.schema.description,
                        url: a.url
                    }
                });
        };
    
        fastify.route(options);
    };
}

import { resources } from '../../data-dictionary/resources.js';
const root = createRoot(resources);

export const routes = [
    root, 
    treatments,
    materialcitations,
    images,
    publications
];