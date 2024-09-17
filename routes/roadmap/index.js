import * as fs from 'fs';

export async function roadmap(fastify, opts) {
    fastify.route({
        method: 'GET',
        url: '/roadmap',
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://example.com/product.schema.json",
            title: "Roadmap",
            summary: 'Roadmap',
            description: "Where next?",
            response: {}
        },
        handler: async (request, reply) => {
            const file = './routes/roadmap/content.html';
            const content = await fs.promises.readFile(file, 'utf8');
            const template = './layouts/main';
            
            return reply.view(template, { content });
        }
    });
};