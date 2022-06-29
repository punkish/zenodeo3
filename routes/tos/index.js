import * as fs from 'fs';

const options = {
    method: 'GET',
    url: '/tos',
    schema: {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://example.com/product.schema.json",
        title: "Terms of Service",
        summary: 'Terms of Service',
        description: "Terms of Service",
        response: {}
    },
    handler: async (request, reply) => {
        const file = './routes/tos/content.html';
        const content = await fs.promises.readFile(file, 'utf8');
        const template = './layouts/main';
        
        return reply.view(template, { content });
    }
};

export async function route(fastify, opts) {
    fastify.route(options);
};