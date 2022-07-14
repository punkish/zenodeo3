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
        path: typeOfArchive === 'full' ? '/dumps/plazi.zenodeo.zip' : `/dumps/plazi.zenodeo.${typeOfArchive}.zip`,
        method: 'HEAD'
    };
    
    const remoteResult = new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            const result = { timeOfArchive: false, sizeOfArchive: 0 };
            if (res.statusCode == 200) {
                result.timeOfArchive  = new Date(res.headers['last-modified']).getTime();
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

    const archive = `${config.truebug.dirs.data}/${config.truebug.download[source]}`;
    const cmd = `unzip -q -n ${archive} -d ${config.truebug.dirs.dump}`;

    if (config.truebug.run === 'real') {
        execSync(cmd);
        let numOfFiles = Number(execSync(`unzip -Z -1 ${archive} | wc -l`).toString().trim());

        /**
         * check if there is an index.xml included in the archive; 
         * if yes, remove it
         */
        if (fs.existsSync(`${config.truebug.dirs.dump}/index.xml`)) {
            fs.rmSync(`${config.truebug.dirs.dump}/index.xml`);
            numOfFiles--;
        }

        log.info(`downloaded ${numOfFiles} files`);

        return numOfFiles;
    }
}

const download = (source) => {
    const local = `${config.truebug.dirs.data}/${config.truebug.download[source]}`;
    const remote = `${config.truebug.server}/${config.truebug.download[source]}`;
    
    if (config.truebug.run === 'real') {
        log.info(`downloading ${source} archive`);
        execSync(`curl -s -o ${local} '${remote}'`);
    }
}

export { checkRemote, download, unzip }