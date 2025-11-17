import fp from 'fastify-plugin';

function zqlite(fastify, db, next) {
    
    if (fastify.zqlite) {
        next(new Error('plugin already registered'));
    }
    
    fastify.decorate('zqlite', db);
    fastify.addHook('onClose', (fastify, done) => db.close(done));

    next();
}

export default fp(zqlite, {
    fastify: '5.x',
    name: 'zqlite'
})