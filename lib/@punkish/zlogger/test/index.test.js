import tap from 'tap';
import { formatDate, formatTime, formatDateTime, convert } from '../index.js';
import Zlogger from '../index.js';

// const d = new Date('2023-06-21');
// tap.equal(formatDate(d), '2023-06-21', 'format date');
// tap.equal(formatTime(d), '00:00:00.0', 'format time');
// tap.equal(formatDateTime(d), '2023-06-21 00:00:00.0', 'format datetime');
// tap.equal(convert('info'), 20, 'convert "info" to number');
// tap.equal(convert(20), 'INFO', 'convert "20" to string');

const log = new Zlogger({ 
    name: 'MY MODULE', 
    level: 'info', 
    transports: [ 'console' ],
    // mode: 'streams' (default),
    // dir: 'logs' (default)
});

log.info(`logger level is ${log.level()}`);
log.info('foo');
log.info('do something and wait… ', 'start');
log.info('finished something\n', 'end');

log.info('no front matter ', 'end');

// for (let i = 0; i < 50; i++) {
//     log.info('.', 'end');
// }

// log.info(' DONE\n', 'end');

log.warn('oops');
log.error('uh oh!');
log.fatal('died');