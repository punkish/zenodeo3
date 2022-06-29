import { resources } from '../../../../data-dictionary/resources.js';

const name = 'Images';
const resource = resources.filter(r => r.name === name)[0];

const options = {
    method: 'GET',
    url: `/${name.replace(/ /g).toLowerCase()}`,
    schema: {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://example.com/product.schema.json",
        name,
        summary: resource.summary,
        description: resource.description,
        response: {},
        querystring: {
            type: 'object',
            properties: {
                treatmentId: { 
                    type: 'string'
                },
                version: {
                    type: 'number'
                },
                communities: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: [
                            'biosyslit',
                            'belgiumherbarium'
                        ]
                    },
                    minItems: 1,
                    maxItems: 2,
                    uniqueItems: true,
                    default: [
                        'biosyslit'
                    ],
                    description: 'The community on Zenodo; defaults to <b>biosyslit</b>. Can be <b>biosyslit</b> and/or <b>belgiumherbarium</b>'
                }
            }            
        },
        tags: resource.tags
    },
    handler: async (request, reply) => {
        return { 
            imageId: request.query.imageId,
            version: request.query.version,
            communities: request.query.communities
        }
    }
};

export async function route(fastify, opts) {
    fastify.route(options)
}