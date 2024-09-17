import * as fs from 'fs';

export async function install(fastify, opts) {
    fastify.route({
        method: 'GET',
        url: '/install',
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://example.com/product.schema.json",
            title: "Install",
            summary: 'Install',
            description: "Install",
            response: {}
        },
        handler: async (request, reply) => {
            const file = './routes/install/content.html';
            const content = await fs.promises.readFile(file, 'utf8');
            const template = './layouts/main';
            
            return reply.view(template, { content });
        }
    });
};