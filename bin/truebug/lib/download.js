'use strict'

import https from 'https';
import { execSync } from 'child_process';
import fs from 'fs';

import { config } from '../../../zconf/index.js';
import { Zlogger } from '@punkish/zlogger';
const logOpts = JSON.parse(JSON.stringify(config.truebug.log));
logOpts.name = 'TRUEBUG:DOWNLOAD';
const log = new Zlogger(logOpts);

const checkRemote = (typeOfArchive = 'daily') => {
    const options = {
        hostname: 'tb.plazi.org',
        port: 443,
        path: typeOfArchive === 'full' 
            ? '/dumps/plazi.zenodeo.zip' 
            : `/dumps/plazi.zenodeo.${typeOfArchive}.zip`,
        method: 'HEAD'
    };
    
    const remoteResult = new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            const result = { timeOfArchive: false, sizeOfArchive: 0 };
            if (res.statusCode == 200) {
                const d = new Date(res.headers['last-modified']);
                result.timeOfArchive  = d.getTime();
                result.sizeOfArchive = res.headers['content-length'];
            }

            resolve(result);
        });
        
        req.on('error', (error) => console.error(error));
        req.end();
    });

    return remoteResult;
}

const unzip = function(source) {    
    log.info(`unzipping ${source} archive`);

    const archive = config.truebug.download[source];
    const local = `${config.truebug.dirs.data}/${archive}`;
    let cmd = `unzip -q -n ${local} -d ${config.truebug.dirs.dump}`;

    if (config.truebug.run === 'real') {
        execSync(cmd);

        cmd = `unzip -Z -1 ${local} | wc -l`;
        let numOfFiles = Number(execSync(cmd).toString().trim());

        /**
         * check if there is an index.xml included in the archive; 
         * if yes, remove it
        **/
        if (fs.existsSync(`${config.truebug.dirs.dump}/index.xml`)) {
            fs.rmSync(`${config.truebug.dirs.dump}/index.xml`);
            numOfFiles--;
        }

        log.info(`downloaded ${numOfFiles} files`);

        return numOfFiles;
    }
}

const download = (source) => {

    /** 
     * source is one of 'daily', 'weekly', 'monthly' or 'full' 
    **/
    const archive = config.truebug.download[source];
    const local = `${config.truebug.dirs.data}/${archive}`;
    const remote = `${config.truebug.server}/${archive}`;
    
    if (config.truebug.run === 'real') {
        log.info(`downloading ${source} archive`);
        execSync(`curl -s -o ${local} '${remote}'`);
    }
}

export { checkRemote, download, unzip }