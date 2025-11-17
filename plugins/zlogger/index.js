import fp from 'fastify-plugin';
import Zlogger from '@punkish/zlogger';
//import Zlogger from '../../../zlogger/index.js';

async function zlog(fastify, options) {

    const logOpts = JSON.parse(JSON.stringify(fastify.zconfig.zlogger));

    // Create a new logger instance
    const zlog = new Zlogger(logOpts);

    if (fastify.zlog) {
        new Error('zlogger plugin already registered');
    }
    
    fastify.decorate('zlog', zlog);
}

export default fp(zlog, {
    fastify: '5.x',
    name: 'zlog'
})