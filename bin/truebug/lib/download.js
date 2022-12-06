'use strict'

import * as utils from './utils.js';

import https from 'https';
import { execSync } from 'child_process';
import fs from 'fs';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;
const ts = truebug.steps.download;

const logOpts = JSON.parse(JSON.stringify(config.truebug.log));
logOpts.name = 'TRUEBUG:DOWNLOAD';
import { Zlogger } from '@punkish/zlogger';
const log = new Zlogger(logOpts);

const checkRemote = (typeOfArchive = 'daily') => {
    const fn = 'checkRemote';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    const remoteResult = new Promise((resolve) => {
        const server = truebug.server.hostname;
        const path = typeOfArchive === 'full' 
            ? `/${truebug.server.path}/plazi.zenodeo.zip`
            : `/${truebug.server.path}/plazi.zenodeo.${typeOfArchive}.zip`;

        const url = `${server}/${path}`;
        const opts = { method: 'HEAD' };
        const req = https.request(url, opts, (res) => {
            const result = {};
    
            if (res.statusCode == 200) {
                const d = new Date(res.headers['last-modified']);
                result.timeOfArchive  = d.getTime();
                result.sizeOfArchive = Number(res.headers['content-length']);
            }
    
            resolve(result);
        });
        
        req.on('error', (error) => console.error(error));
        req.end();
    });

    return remoteResult;
}

const unzip = function(typeOfArchive) {
    const fn = 'unzip';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    log.info(`unzipping ${typeOfArchive} archive… `, 'start');
    const started = new Date().getTime();
    let numOfFiles = 0;

    const archive = `${truebug.dirs.data}/${truebug.download[typeOfArchive]}`;
    const targetDir = truebug.dirs[typeOfArchive];

    /**
     * -q Perform operations quietly.
     * -n never overwrite existing files
     * -d extract files into exdir
     */
    let cmd = `unzip -q -n ${archive} -d ${targetDir}`;

    if (truebug.runMode === 'real') {
        execSync(cmd);

        /**
         * -Z   Switch to zipinfo mode.  Must be first option.
         * -1  List names only, one per line. No headers/trailers.
         */ 
        cmd = `unzip -Z -1 ${archive} | wc -l`;
        numOfFiles = Number(execSync(cmd).toString().trim());

        /**
         * check if there is an index.xml included in the archive; 
         * if yes, remove it
         */
        if (fs.existsSync(`${targetDir}/index.xml`)) {
            fs.rmSync(`${targetDir}/index.xml`);
            numOfFiles--;
        }
    }

    const ended = new Date().getTime();
    const duration = ended - started;
    log.info(`done. Took ${duration} ms\n`, 'end');
    log.info(`downloaded archive contains ${numOfFiles} files`);

    return { ended, numOfFiles };
}

const download = (source) => {
    const fn = 'download';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    log.info(`downloading ${source} archive… `, 'start');
    const started = new Date().getTime();

    /** 
     * source is one of 'daily', 'weekly', 'monthly' or 'full' 
     */
    const archive = truebug.download[source];
    const local = `${truebug.dirs.data}/${archive}`;
    const server = `${truebug.server.hostname}/${truebug.server.path}`;
    const remote = `${server}/${archive}`;
    
    if (truebug.runMode === 'real') {
        execSync(`curl -s -o ${local} '${remote}'`);
    }

    const ended = new Date().getTime();
    const duration = ended - started;
    log.info(`done. Took ${duration} ms\n`, 'end');
    return { started };
}

export { checkRemote, download, unzip }