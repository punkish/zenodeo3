import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import Zlogger from '@punkish/zlogger';
//import Zlogger from '../../../../zlogger/index.js';

// Initialize the logger
// const logOpts = {
//     "level"     : "info",
//     "transports": [ 'console' ],
//     //"dir"       : path.join(cwd, 'bin/newbug/logs'),
//     "snipPrefix": "bin/vectorize"
// };

const configLogger = JSON.parse(JSON.stringify(config.logger));
configLogger.snipPrefix = 'bin/vectorize';

const logger = new Zlogger(configLogger);
export { logger }