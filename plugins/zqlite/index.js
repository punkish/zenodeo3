import fp from 'fastify-plugin';
import { connectDb } from '../../lib/dbconn.js';

function zqlite(fastify, options) {
    //const dbOpts = JSON.parse(JSON.stringify(fastify.zconfig.database));
    
    const db = connectDb({
        configDatabase: fastify.zconfig.database,
        logger: fastify.zlog
    });

    if (fastify.zqlite) {
        next(new Error('plugin already registered'));
    }
    
    fastify.decorate('zqlite', db);
    fastify.addHook('onClose', (fastify, done) => db.close(done));
}

export default fp(zqlite, {
    fastify: '5.x',
    name: 'zqlite'
})