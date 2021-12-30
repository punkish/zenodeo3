'use strict'

const config = require('config');
const truebug = config.get('truebug');

const Logger = require('../utils');
const log = new Logger({
    level: truebug.log.level, 
    transports: truebug.log.transports, 
    logdir: truebug.dirs.logs
});

const fs = require('fs');
const path = require('path');

const dirExists = (dirtype) => {
    log.info(`checking if ${dirtype} exists… `, 'start');

    const dir = truebug.dirs[dirtype];
    let cmd = `fs.existsSync('${dir}')`;
    const exists = eval(cmd);
    if (exists) log.info('yes, it does\n', 'end');
    return exists;
}

const createDir = (dirtype) => {
    const dir = truebug.dirs[dirtype];
    const cmd = `fs.mkdirSync('${dir}')`;
    log.info(`it doesn't exist… making it\n`, 'end');
    
    if (truebug.run === 'real') eval(cmd);
}

const checkDir = (dirtype) => {
    if (!dirExists(dirtype)) createDir(dirtype);
}

const fileaway = (xml) => {        
    const src = `${config.get('truebug.dirs.dump')}/${xml}`;

    const one = xml.substr(0, 1);
    const two = xml.substr(0, 2);
    const thr = xml.substr(0, 3);
    const dst = `${config.get('truebug.dirs.archive')}/${one}/${two}/${thr}`;

    const cleanname = xml.replace(/\.\./, '.');
    const tgt = `${dst}/${cleanname}`;

    const cmd1 = `fs.mkdirSync('${dst}', {recursive: true})`;
    const cmd2 = `fs.copyFileSync('${src}', '${tgt}')`;
    const cmd3 = `fs.rmSync('${src}')`;
    
    if (truebug.run === 'real') {
        eval(cmd1)
        eval(cmd2)
        eval(cmd3)
    }
}

const filesExistInDump = () => fs.readdirSync(truebug.dirs.dump).filter(f => path.extname(f) === '.xml')

module.exports = { checkDir, filesExistInDump, fileaway }