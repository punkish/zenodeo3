import * as fs from 'fs';

export async function queryHelp(fastify, opts) {
    fastify.route({
        method: 'GET',
        url: '/query-help',
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://example.com/product.schema.json",
            title: "Query Help",
            summary: 'Query Help',
            description: "Query Help",
            response: {}
        },
        handler: async (request, reply) => {
            const file = './routes/query-help/content.html';
            const content = await fs.promises.readFile(file, 'utf8');
            const template = './layouts/main';
            
            return reply.view(template, { content });
        }
    });
};