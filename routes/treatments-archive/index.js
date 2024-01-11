import * as fs from 'fs';

export async function treatmentsArchive(fastify, opts) {
    fastify.route({
        method: 'GET',
        url: '/treatments-archive/:treatmentId',
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://example.com/product.schema.json",
            title: "Treatment",
            summary: 'Treatment',
            description: "Treatment",
            response: {}
        },
        handler: async (request, reply) => {
            const { treatmentId } = request.params;
            const one = treatmentId.substring(0, 1);
            const two = treatmentId.substring(0, 2);
            const thr = treatmentId.substring(0, 3);
            const xml = `./data/treatments-archive/${one}/${two}/${thr}/${treatmentId}.xml`;
            const content = await fs.promises.readFile(xml, 'utf8');
            reply.header('Content-Type', 'text/html; charset=utf-8');
            const template = './layouts/xml';
            return reply.view(template, { content });
            //return reply.send(content);
            //return content;
        }
    });
};