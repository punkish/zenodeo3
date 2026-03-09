import fp from 'fastify-plugin';
import { Searcher } from '../../bin/vectorize/lib/searcher.js';

function zsearch(fastify, options) {    

    if (fastify.zsearch) {
        next(new Error('plugin already registered'));
    }
    
    const s = new Searcher(fastify.zqlite);
    fastify.decorate('zsearch', s);
    fastify.addHook('onClose', (fastify, done) => s.close(done));
}

export default fp(zsearch, {
    fastify: '5.x',
    name: 'zsearch'
})