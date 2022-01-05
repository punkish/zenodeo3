'use strict';

const Logger = require('./utils');

const level = 'info';
const transports = [ 'console' ];
//const logdir = '/Users/punkish/Projects/zenodeo/zenodeo3/bin/truebug/logs'
const log = new Logger({level, transports})

log.loglevel();

const progress = (idx, batch, dot) => {
    if (idx > 0) {
        if ((idx % batch) == 0) log.info(` ${idx} `, 'end');
        if ((idx % dot) == 0) log.info('.', 'end');
    }
}

const total = 1005;
const batch = 20;
const dot = batch / 10;
[...Array(total)].forEach((item, idx) => {
    const prog = () => progress(idx, batch, dot);
    setTimeout(prog, 1000);
})

log.info(` ${total}\n`, 'end');
log.info('DONE');