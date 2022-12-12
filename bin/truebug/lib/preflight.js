'use strict';

import * as utils from './utils.js';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;
const ts = truebug.steps.preflight;

const logOpts = JSON.parse(JSON.stringify(truebug.log));
logOpts.name = 'TRUEBUG:PREFLIGHT';
import { Zlogger } from '@punkish/zlogger';
const log = new Zlogger(logOpts);

const dbType = config.dbType;

import fs from 'fs';
import path from 'path';
import tar from 'tar';

const checkDir = (dir, empty = false) => {
    const fn = 'checkDir';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    log.info(`checking if ${dir} directory exists… `, 'start');

    const tgt = truebug.dirs[dir];
    const exists = fs.existsSync(tgt);

    if (exists) {
        log.info('yes, it does\n', 'end');

        if (empty) {
            log.info(`removing all files from ${dir} directory… `, 'start');
            fs.readdirSync(tgt).forEach(f => fs.rmSync(`${tgt}/${f}`));
            log.info('done\n', 'end');
        }
    }
    else {
        log.info("it doesn't exist… making it\n", 'end');
        
        if (truebug.runMode === 'real') {
            fs.mkdirSync(tgt);
        }
    }
}

const copyXmlToDump = (typeOfArchive, xml) => {
    const fn = 'copyXmlToDump';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    const srcPath = utils.pathToXml(xml);
    const src = `${srcPath}/${xml}`;
    const tgt = `${truebug.dirs.dumps}/${typeOfArchive}/${xml}`;
    
    if (truebug.runMode === 'real') {
        fs.copyFileSync(src, tgt);
    }
}

const _backup = (db) => {
    const fn = '_backup';
    utils.incrementStack(logOpts.name, fn);

    const d = config.db[db];
    const bak_d = `${d.split('.')[0]}.bak.sqlite`;
    const bak_d_tmp = `${bak_d}.tmp`;

    log.info(`backing up old db ${db}… `, 'start');

    if (fs.existsSync(bak_d)) {
        if (config.truebug.runMode === 'real') {
            fs.renameSync(bak_d, bak_d_tmp);
            fs.copyFileSync(d, bak_d);
            fs.rmSync(bak_d_tmp);
        }
    }

    log.info(`done\n`, 'end');
}

const backupOldDB = () => {
    const fn = 'backupOldDB';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    log.info(`backing up old ${dbType} db… `, 'start');

    if (dbType === 'single' || dbType === 'both') {
        _backup('treatments');
        _backup('stats');
    }
    else if (dbType === 'exploded' || dbType === 'both') {
        const dataDir = path.join('.', '..', 'data');
        const dbDir = path.join(dataDir, 'z3');
        const backupDir = path.join(dataDir, 'z3-bak');
        const d = new Date().toDateString().split(' ').join('-');
        const r = Math.random().toString(36).slice(2);
        const backupName = `z3-${d}-${r}.tgz`;
        
        const tarOpts = {
            gzip: true,
            file: path.join(dataDir, backupDir, backupName),
            sync: true
        }
        
        try {
            tar.create(tarOpts, [ dbDir ]);
        }
        catch(error) {
            log.error(error);
        }
    }

    log.info('done\n', 'end');
}

const filesExistInDump = (typeOfArchive) => {
    const fn = 'filesExistInDump';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    const archive = path.join(truebug.dirs.dumps, typeOfArchive);

    return fs.readdirSync(archive)
        .filter(f => path.extname(f) === '.xml');
}

export { 
    checkDir, 
    copyXmlToDump,
    filesExistInDump, 
    backupOldDB 
}