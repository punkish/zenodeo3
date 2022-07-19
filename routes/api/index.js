import { route as etlStats } from './metadata/etlstats.js';
import { route as treatments } from './zenodeo/treatments.js';
import { route as materialCitations } from './zenodeo/materialcitations.js';
import { route as treatmentCitations } from './zenodeo/treatmentcitations.js';
import { route as bibRefCitations } from './zenodeo/bibrefcitations.js';
import { route as figureCitations } from './zenodeo/figurecitations.js';
import { route as treatmentImages } from './zenodeo/treatmentimages.js';
import { route as collectionCodes } from './zenodeo/collectioncodes.js';
import { route as families } from './zenodeo/families.js';
import { route as images } from './zenodo/images.js';
import { route as publications } from './zenodo/publications.js';

import { resources } from '../../data-dictionary/resources.js';
import { config } from '../../zconf/index.js';

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
                        url: `${config.url.zenodeo}${a.url}`
                    }
                });
        };
    
        fastify.route(options);
    };
}

const root = createRoot(resources);

export const routes = [
    root, 
    treatments,
    materialCitations,
    treatmentCitations,
    bibRefCitations,
    figureCitations,
    treatmentImages,
    collectionCodes,
    families,
    images,
    publications,
    etlStats
];