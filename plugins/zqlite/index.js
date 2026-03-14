import fp from 'fastify-plugin';
import { DbConnection } from '../../lib/dbconn.js';

function zqlite(fastify, options) {    
    const db = new DbConnection({
        configDatabase: fastify.zconfig.database,
        logger: fastify.zlog,
        readonly: false
    }).getDb();

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