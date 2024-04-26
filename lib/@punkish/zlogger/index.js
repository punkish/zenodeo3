import fs from 'fs';

const levels = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40, FATAL: 50 };

const colors = {
    black  : '\u001b[30m',
    red    : '\u001b[31m',
    green  : '\u001b[32m',
    yellow : '\u001b[33m',
    blue   : '\u001b[34m',
    purple : '\u001b[35m',
    cyan   : '\u001b[36m',
    white  : '\u001b[37m',
    reset  : '\u001b[39m'
};

// set the color, write the str, reset the color
const c = (str, clr) => process.stdout.write(`${colors[clr]}${str}${colors.reset} `);

// write the string in the defined color
const r = (str) => c(str, 'red');
const g = (str) => c(str, 'green');
const b = (str) => c(str, 'blue');
const y = (str) => c(str, 'yellow');

const formatDate = (d) => {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
}

const formatTime = (d) => {
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    const ms = d.getTime() % 1000;

    return `${hh}:${mm}:${ss}.${ms}`;
}

const formatDateTime = (d) => `${formatDate(d)} ${formatTime(d)}`;

const convert = (input) => {

    // convert level from number to string, or
    if (typeof(input) === 'number') {
        const keys = Object.keys(levels);
        const vals = Object.values(levels);

        return keys[vals.indexOf(input)];
    }

    // convert level from string to number
    return levels[ input.toUpperCase() ];
}

const bleached = ({ logger, pos, ts, str, level, eol }) => {

    // we write to a file *only* if the message level is > 0
    if (!level) return;
    const convertedLevel = convert(level);
    const paddedLevel = convertedLevel.padStart(5, ' ');
    const output = logger.output[ convertedLevel.toLowerCase() ];

    if (pos) {

        if (pos === 'start') {
            str = `${ts} ${logger.name} ${paddedLevel} ${str}`;
            if (eol) str += '\n';
        }

    }
    else {
        str = `${ts} ${logger.name} ${paddedLevel} ${str}`;
        if (eol) str += '\n';
    }

    if (logger.mode === 'streams') {
        output.write(str);
    }
    else {
        fs.appendFileSync(output, str);
    }
}

const colored = ({ logger, pos, ts, str, level, eol }) => {
    const convertedLevel = convert(level);
    const paddedLevel = convertedLevel.padStart(5, ' ');

    if (pos) {

        if (pos === 'start') {
            b(ts);
            r(logger.name);
            g(`– ${paddedLevel}`);
            if (eol) str += '\n';
        }

    }
    else {
        b(ts);
        r(logger.name);
        g(`– ${paddedLevel}`);
        if (eol) str += '\n';
    }

    process.stdout.write(str);
}

const write = (logger, msg, pos, level) => {    

    // convert logger.level from string to number so it can be compared
    const convertedLoggerLevel = convert(logger.level);
    
    // we output a message if the message level is 0 or if the message level 
    // is less than or equal to the loggerLevel
    if ((level === 0) || (convertedLoggerLevel <= level)) {
        const obj = {
            logger,
            pos: pos || null,
            ts: formatDateTime(new Date()),
            str: typeof(msg) === 'object' ? JSON.stringify(msg) : msg,
            level,
            eol: pos ? false : true
        };

        if (logger.transports.includes('console')) {
            colored(obj);
        }
        
        if (logger.transports.includes('file')) {
            bleached(obj);
        }
    }

}

export default class Zlogger {
    constructor({ name, level, transports, mode, dir }) {
        this.logger = {
            name      : name                || '',
            level     : level.toUpperCase() || 'INFO',
            transports: transports          || [ 'console' ],
            mode      : mode                || 'streams'
        }

        if (this.logger.transports.includes('file')) {
            const date = formatDate(new Date());
            const basedir = dir || 'logs';
            const logdir = `${basedir}/${date}`;

            if (!fs.existsSync(logdir)) {
                fs.mkdirSync(logdir, { recursive: true });
            }

            this.logger.output = {};

            Object.keys(levels).forEach(level => {

                // create output files only for actual log levels > 0
                if (convert(level)) {
                    const l = level.toLowerCase();
                    const logfile = `${logdir}/${date}-${l}.log`;

                    this.logger.output[l] = this.logger.mode === 'streams'
                        ? fs.createWriteStream(logfile, { flags: 'a' })
                        : logfile;
                }

            });

        }
    }

    level = ()         => this.logger.level;
    debug = (msg, pos) => write(this.logger, msg, pos, 10);
    info  = (msg, pos) => write(this.logger, msg, pos, 20);
    warn  = (msg, pos) => write(this.logger, msg, pos, 30);
    error = (msg, pos) => write(this.logger, msg, pos, 40);
    fatal = (msg, pos) => write(this.logger, msg, pos, 50);
}

export { formatDate, formatTime, formatDateTime, convert };