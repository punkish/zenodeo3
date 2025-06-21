import fp from 'fastify-plugin';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const logOpts = JSON.parse(JSON.stringify(config.zlogger));
//import Zlogger from '@punkish/zlogger';
import Zlogger from '../../../zlogger/index.js';

//import { Cache } from '@punkish/zcache';
// import { Cache } from '../../../zcache/index.js';

async function zlog(fastify, options) {

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