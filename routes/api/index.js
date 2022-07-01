import { route as etlStats } from './metadata/etlStats.js';
import { route as treatments } from './zenodeo/treatments.js';
import { route as materialCitations } from './zenodeo/materialCitations.js';
import { route as treatmentCitations } from './zenodeo/treatmentCitations.js';
import { route as bibRefCitations } from './zenodeo/bibRefCitations.js';
import { route as figureCitations } from './zenodeo/figureCitations.js';
import { route as treatmentImages } from './zenodeo/treatmentImages.js';
import { route as collectionCodes } from './zenodeo/collectionCodes.js';
import { route as families } from './zenodeo/families.js';
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
    etlStats,
    treatments,
    materialCitations,
    treatmentCitations,
    bibRefCitations,
    figureCitations,
    treatmentImages,
    collectionCodes,
    families,
    images,
    publications
];