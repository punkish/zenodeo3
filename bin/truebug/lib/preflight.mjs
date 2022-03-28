'use strict'

import config from 'config';
const truebug = config.get('truebug');

import { Zlogger } from '@punkish/zlogger';
const logOpts = JSON.parse(JSON.stringify(config.get('truebug.log')));
logOpts.name  = 'TRUEBUG:PREFLIGHT';
const log     = new Zlogger(logOpts);

import fs from 'fs';
import path from 'path';

const checkDir = (dir) => {
    log.info(`checking if ${dir} exists… `, 'start');

    const exists = fs.existsSync(truebug.dirs[dir]);
    if (exists) {
        log.info('yes, it does', 'end');
    }
    else {
        log.info("it doesn't exist… making it", 'end');
        
        if (truebug.run === 'real') {
            fs.mkdirSync(truebug.dirs[dir]);
        }
    }
}

const pathToXml = (xml) => {
    const one = xml.substr(0, 1);
    const two = xml.substr(0, 2);
    const thr = xml.substr(0, 3);
    const dir = `${config.get('truebug.dirs.archive')}/${one}/${two}/${thr}`;

    return dir;
}

const copyXmlToDump = (xml) => {
    const srcPath = pathToXml(xml);
    const src = `${srcPath}/${xml}`;
    const tgt = `${truebug.dirs.dump}/${xml}`;
    fs.copyFileSync(src, tgt);
}

const fileaway = (xml) => {        
    const src = `${config.get('truebug.dirs.dump')}/${xml}`;
    
    if (truebug.run === 'real') {
        if (truebug.savexmls) {
            const tgt = pathToXml(xml);
            fs.mkdirSync(dst, { recursive: true });
            fs.copyFileSync(src, tgt);
        }

        fs.rmSync(src);
    }
}

const backup = (db) => {
    const d = config.get(`db.${db}`);
    const bak_d = `${d.split('.')[0]}.bak.sqlite`;

    if (fs.existsSync(bak_d)) {
        log.info(`backing up old db ${db}… `, 'start');
        if (truebug.run === 'real') {
            fs.rmSync(bak_d);
        }
    }

    if (truebug.run === 'real') {
        fs.copyFileSync(d, bak_d);
    }
    log.info(`done\n`, 'end');
}

const backupOldDB = () => {
    backup('treatments');
    backup('stats');
}

const filesExistInDump = () => fs.readdirSync(truebug.dirs.dump).filter(f => path.extname(f) === '.xml')

export { 
    checkDir, 
    //pathToXml, 
    copyXmlToDump,
    filesExistInDump, 
    fileaway, 
    backupOldDB 
}