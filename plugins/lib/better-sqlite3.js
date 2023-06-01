'use strict'

import fp from 'fastify-plugin';
import { initDb } from '../../lib/dbconn.js';

function fastifyBetterSqlite3 (fastify, options, done) {

    if (!fastify.betterSqlite3) {
        const db = initDb();
        fastify.decorate('betterSqlite3', db);
    }

    fastify.addHook('onClose', (fastify, done) => db.close()
        .then(done)
        .catch(done));

    done();
}

export default fp(fastifyBetterSqlite3, {
    name: 'fastify-better-sqlite3',
    fastify: '^4.x'
})

// let the user access the sqlite3 mode constants eg: sqlite3.OPEN_READONLY
//module.exports.sqlite3 = sqlite3