import { resources } from '../../data-dictionary/resources.js';

const name = 'root';
const resource = resources.filter(r => r.name === name)[0];

import * as zenodeo from './zenodeo/index.js';
import * as zenodo from './zenodo/index.js';

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

const root = async function (fastify, opts) {
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

export const routes = [
    root, 
    zenodeo.treatments,
    zenodeo.materialcitations,
    zenodo.images,
    zenodo.publications
];