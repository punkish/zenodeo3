import * as fs from 'fs';

export async function about(fastify, opts) {
    fastify.route({
        method: 'GET',
        url: '/about',
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://example.com/product.schema.json",
            title: "About",
            summary: 'About Zenodeo',
            description: "About Zenodeo",
            response: {}
        },
        handler: async (request, reply) => {
            const file = './routes/about/content.html';
            const content = await fs.promises.readFile(file, 'utf8');
            const template = './layouts/main';
            
            return reply.view(template, { content });
        }
    });
};