import fp from 'fastify-plugin';
import Zlogger from '@punkish/zlogger';
//import Zlogger from '../../../zlogger/index.js';

async function zlog(fastify, options) {
    //const loggerOpts = JSON.parse(JSON.stringify(fastify.zconfig.logger));

    // Create a new logger instance
    const zlog = new Zlogger(fastify.zconfig.logger);

    if (fastify.zlog) {
        new Error('zlogger plugin already registered');
    }
    
    fastify.decorate('zlog', zlog);
}

export default fp(zlog, {
    fastify: '5.x',
    name: 'zlog'
})