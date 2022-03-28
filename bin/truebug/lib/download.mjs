'use strict'

// The following two lines make "require" available
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);

// const https = require('https');
// const execSync = require('child_process').execSync;

import https from 'https';
import { execSync } from 'child_process';
// const fs = require('fs');
import fs from 'fs';

// const config = require('config');
import config from 'config';
const truebug = config.get('truebug');

import { Zlogger } from '@punkish/zlogger';
const logOpts = JSON.parse(JSON.stringify(config.get('truebug.log')));
logOpts.name  = 'TRUEBUG:DOWNLOAD';
const log     = new Zlogger(logOpts);

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

            resolve(result)
        });
        
        req.on('error', (error) => console.error(error));
        req.end();
    });

    return remoteResult;
}

const unzip = function(source) {    
    log.info(`unzipping ${source} archive`);

    const archive = `${truebug.dirs.data}/${truebug.download[source]}`;
    const cmd = `unzip -q -n ${archive} -d ${truebug.dirs.dump}`;

    if (truebug.run === 'real') {
        execSync(cmd);
        let numOfFiles = Number(execSync(`unzip -Z -1 ${archive} | wc -l`).toString().trim());

        // check if there is an index.xml included in the archive; 
        // if yes, remove it
        const idx = `${truebug.dirs.dump}/index.xml`
        if (fs.existsSync(idx)) {
            fs.rmSync(idx);
            numOfFiles--;
        }

        log.info(`downloaded ${numOfFiles} files`);

        return numOfFiles;
    }
}

const download = (source) => {
    const local = `${truebug.dirs.data}/${truebug.download[source]}`;
    const remote = `${truebug.server}/${truebug.download[source]}`;
    
    if (truebug.run === 'real') {
        log.info(`downloading ${source} archive`);
        //execSync(`curl -s -o ${local} '${remote}'`);
    }
}

export { checkRemote, download, unzip }