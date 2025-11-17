import fp from 'fastify-plugin';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;

async function zconfig(fastify, options) {

    if (fastify.zconfig) {
        new Error('zconfig plugin already registered');
    }
    
    fastify.decorate('zconfig', config);
}

export default fp(zconfig, {
    fastify: '5.x',
    name: 'zconfig'
})