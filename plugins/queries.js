import fp from 'fastify-plugin';

const fastifyQueries = (fastify, options, next) => {

    let queries = {};

    // options is a ready made db connection, so use it
    if (options) {
        queries = options;
    }
    
    if (fastify.queries) {
        next(new Error('plugin already registered'));
    }
    
    fastify.decorate('queries', queries);
    next();
}

export default fp(fastifyQueries, {
    fastify: '4.x',
    name: 'fastify-queries'
})