'use strict'

import { pathToXml } from './utils.js';
// import { config } from '../../../zconf/index.js';
import * as dotenv from 'dotenv';
dotenv.config();
import { config } from '@punkish/zconfig';

import { Zlogger } from '@punkish/zlogger';
const logOpts = JSON.parse(JSON.stringify(config.truebug.log));
logOpts.name = 'TRUEBUG:PREFLIGHT';
const log = new Zlogger(logOpts);

import fs from 'fs';
import path from 'path';

const checkDir = (dir) => {
    log.info(`checking if ${dir} exists… `, 'start');

    const exists = fs.existsSync(config.truebug.dirs[dir]);
    if (exists) {
        log.info('yes, it does\n', 'end');
    }
    else {
        log.info("it doesn't exist… making it\n", 'end');
        
        if (config.truebug.run === 'real') {
            fs.mkdirSync(config.truebug.dirs[dir]);
        }
    }
}

const copyXmlToDump = (xml) => {
    const srcPath = pathToXml(xml);
    const src = `${srcPath}/${xml}`;
    const tgt = `${config.truebug.dirs.dump}/${xml}`;
    fs.copyFileSync(src, tgt);
}

const fileaway = (xml) => {        
    const src = `${config.truebug.dirs.dump}/${xml}`;
    
    if (config.truebug.run === 'real') {
        if (config.truebug.savexmls) {
            const tgt = pathToXml(xml);
            fs.mkdirSync(dst, { recursive: true });
            fs.copyFileSync(src, tgt);
        }

        fs.rmSync(src);
    }
}

const backup = (db) => {
    const d = config.db[db];
    const bak_d = `${d.split('.')[0]}.bak.sqlite`;

    if (fs.existsSync(bak_d)) {
        log.info(`backing up old db ${db}… `, 'start');
        if (config.truebug.run === 'real') {
            fs.rmSync(bak_d);
        }
    }

    if (config.truebug.run === 'real') {
        fs.copyFileSync(d, bak_d);
    }
    log.info(`done\n`, 'end');
}

const backupOldDB = () => {
    backup('treatments');
    backup('stats');
}

const filesExistInDump = () => fs.readdirSync(config.truebug.dirs.dump).filter(f => path.extname(f) === '.xml')

export { 
    checkDir, 
    copyXmlToDump,
    filesExistInDump, 
    fileaway, 
    backupOldDB 
}