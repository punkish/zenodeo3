'use strict'

const config = require('config');
const truebug = config.get('truebug');

const Logger = require('../utils');
const log = new Logger(truebug.log);

const fs = require('fs');
const path = require('path');

const checkDir = (dir) => {
    log.info(`checking if ${dir} exists… `, 'start');

    const exists = fs.existsSync(truebug.dirs[dir]);
    if (exists) {
        log.info('yes, it does\n', 'end');
    }
    else {
        log.info(`it doesn't exist… making it\n`, 'end');
        
        if (truebug.run === 'real') {
            fs.mkdirSync(truebug.dirs[dir]);
        }
    }
}

const fileaway = (xml) => {        
    const src = `${config.get('truebug.dirs.dump')}/${xml}`;

    // const one = xml.substr(0, 1);
    // const two = xml.substr(0, 2);
    // const thr = xml.substr(0, 3);
    // const dst = `${config.get('truebug.dirs.archive')}/${one}/${two}/${thr}`;

    // const cleanname = xml.replace(/\.\./, '.');
    // const tgt = `${dst}/${cleanname}`;

    // const cmd1 = `fs.mkdirSync('${dst}', {recursive: true})`;
    // const cmd2 = `fs.copyFileSync('${src}', '${tgt}')`;
    // const cmd3 = `fs.rmSync('${src}')`;
    
    if (truebug.run === 'real') {
        // eval(cmd1)
        // eval(cmd2)
        fs.rmSync(src);
    }
}

const backup = (db) => {
    const d = config.get(`db.${db}`);
    const bak_d = `${d.split('.')[0]}.bak.sqlite`;

    if (fs.existsSync(bak_d)) {
        log.info(`backing up old db ${db}… `, 'start');
        fs.rmSync(bak_d);
    }

    fs.copyFileSync(d, bak_d);
    log.info(`done\n`, 'end');
}

const backupOldDB = () => {
    backup('treatments');
    backup('stats');
}

const filesExistInDump = () => fs.readdirSync(truebug.dirs.dump).filter(f => path.extname(f) === '.xml')

module.exports = { checkDir, filesExistInDump, fileaway, backupOldDB }