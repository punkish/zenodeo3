import * as fs from 'fs';

export async function bins(fastify, opts) {
    fastify.route({
        method: 'GET',
        url: '/bins/:binLevel',
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://example.com/product.schema.json",
            title: "Bins",
            summary: 'Treatment locations',
            description: "Treatment data binned by point density",
            response: {}
        },
        handler: async (request, reply) => {
            const { binLevel } = request.params;
            const binsFile = `./data/h3/treatments-density-h3-${binLevel}.json`;
            const content = await fs.promises.readFile(binsFile, 'utf8');
            reply.header('Content-Type', 'application/json; charset=utf-8');
            // const template = './layouts/xml';
            // return reply.view(template, { content });
            return reply.send(content);
            //return content;
        }
    });
};