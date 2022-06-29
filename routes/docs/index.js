const options = {
    method: 'GET',
    url: '/',
    schema: {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://example.com/product.schema.json",
        title: "docs",
        summary: 'API documentation',
        description: 'API documentation'
    },
    handler: async (request, reply) => {
        const template = './layouts/docs';
        return reply.view(template, {});
    }
};

export async function route(fastify, opts) {
    fastify.route(options);
}