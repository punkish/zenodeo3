'use strict'

import * as utils from './utils.js';

import https from 'https';
import http from 'http';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;
const ts = truebug.steps.download;

const logOpts = JSON.parse(JSON.stringify(config.truebug.log));
logOpts.name = 'TB:DOWNLOAD  ';
import { Zlogger } from '@punkish/zlogger';
const log = new Zlogger(logOpts);


import stream from 'node:stream';
import { pipeline as streamPipeline } from 'node:stream/promises';
//import fs from 'node:fs';
import got from 'got';

const download = async (typeOfArchive, stats) => {
    stats.downloads.started = new Date().getTime();

    const remoteArchive = typeOfArchive === 'yearly' 
        ? 'plazi.zenodeo.zip'
        : `plazi.zenodeo.${typeOfArchive}.zip`;
    const pathToArchive = `/${truebug.server.path}/${remoteArchive}`;
    const url = `${truebug.server.hostname}/${pathToArchive}`;

    log.info(`checking if there is "${remoteArchive}" on the server…`, 'start');
    const { headers } = await got(url);
    log.info(' yes, there is\n', 'end');

    const d = new Date(headers['last-modified']);
    const timeOfArchive = d.toISOString().split('T')[0];
    const archive_name = `${typeOfArchive}.${timeOfArchive}`;
    const localCopy = `${truebug.dirs.zips}/${archive_name}.zip`;

    stats.archives.typeOfArchive = typeOfArchive;
    stats.archives.timeOfArchive = timeOfArchive;
    stats.archives.sizeOfArchive = Number(headers['content-length']);
    
    await streamPipeline(
        got.stream(url),
        fs.createWriteStream(localCopy)
    );

    stats.downloads.ended = new Date().getTime();
}

const unzip = function(archive, stats) {
    const fn = 'unzip';
    if (!ts[fn]) return [];

    utils.incrementStack(logOpts.name, fn);
    stats.unzip.started = new Date().getTime();
    const archive_name = `${archive.typeOfArchive}.${archive.timeOfArchive}`;
    log.info(`checking if "${archive_name}" has already been unzipped…`, 'start');
    const archive_dir = `${truebug.dirs.data}/treatments-dumps/${archive_name}`;
    
    if (fs.existsSync(archive_dir)) {
        log.info(' yes, it has been\n', 'end');
    }
    else {
        log.info(" no, it hasn't\n", 'end');
        log.info(`unzipping "${archive_name}.zip"…`, 'start');
        const archive = `${truebug.dirs.zips}/${archive_name}.zip`;
    
        // 
        // -q Perform operations quietly.
        // -n never overwrite existing files
        // -d extract files into exdir
        let cmd = `unzip -q -n ${archive} -d ${archive_dir}`;
    
        if (truebug.mode !== 'dryRun') {
            execSync(cmd);
            
            //
            // check if there is an index.xml included in the archive; 
            // if yes, remove it
            if (fs.existsSync(`${archive_dir}/index.xml`)) {
                fs.rmSync(`${archive_dir}/index.xml`);
            }
        }

        log.info(` done.\n`, 'end');
    }

    const files = fs.readdirSync(archive_dir)
        .filter(f => path.extname(f) === '.xml');

    stats.unzip.numOfFiles = files.length;
    stats.unzip.ended = new Date().getTime();
    log.info(`downloaded archive contains ${files.length} files`);

    return files;
}

const checkServerForArchive = async (typeOfArchive = 'daily', stats) => {

    //
    // construct the remote file name and path to it on the server
    //
    const remoteArchive = typeOfArchive === 'yearly' 
        ? 'plazi.zenodeo.zip'
        : `plazi.zenodeo.${typeOfArchive}.zip`;
    const pathToArchive = `/${truebug.server.path}/${remoteArchive}`;
    const url = `${truebug.server.hostname}/${pathToArchive}`;

    log.info(`checking if there is "${remoteArchive}" on the server…`, 'start');

    const res = await fetch(url);

    if (res.ok) {
        log.info(' yes, there is\n', 'end');
        const d = new Date(res.headers.get('last-modified'));
        const timeOfArchive = d.toISOString().split('T')[0];
        stats.archives.typeOfArchive = typeOfArchive;
        stats.archives.timeOfArchive = timeOfArchive;
        stats.archives.sizeOfArchive = Number(res.headers.get('content-length'));
        return timeOfArchive;
    }
    else {
        log.info(' there is not\n', 'end');
        return false;
    }
}

// https://stackoverflow.com/a/74722818/183692
const download_works = async (archive, stats) => {
    stats.downloads.started = new Date().getTime();

    const remoteArchive = archive.typeOfArchive === 'yearly' 
        ? 'plazi.zenodeo.zip'
        : `plazi.zenodeo.${archive.typeOfArchive}.zip`;

    const pathToArchive = `/${truebug.server.path}/${remoteArchive}`;
    const url = `${truebug.server.hostname}/${pathToArchive}`;

    log.info(`checking if there is "${remoteArchive}" on the server…`, 'start');
    const res = await fetch(url);

    if (res.ok) {
        const d = new Date(res.headers.get('last-modified'));
        const timeOfArchive = d.toISOString().split('T')[0];
        stats.archives.typeOfArchive = archive.typeOfArchive;
        stats.archives.timeOfArchive = timeOfArchive;
        stats.archives.sizeOfArchive = Number(res.headers.get('content-length'));

        const archive_name = `${archive.typeOfArchive}.${archive.timeOfArchive}`;
        const localCopy = `${truebug.dirs.zips}/${archive_name}.zip`;
        const file = fs.createWriteStream(localCopy);

        try {
            await finished(Readable.fromWeb(res.body).pipe(file));
            stats.downloads.ended = new Date().getTime();
        } 
        catch (err) {
            console.error(err.stack);
        }
    }
    else {
        log.info(' there is not\n', 'end');
        stats.downloads.ended = new Date().getTime();
        return false;
    }
}


const download_old = async (typeOfArchive = 'daily', stats) => {
    stats.downloads.started = new Date().getTime();

    //
    // construct the remote file name and path to it on the server
    //
    const remoteArchive = typeOfArchive === 'yearly' 
        ? 'plazi.zenodeo.zip'
        : `plazi.zenodeo.${typeOfArchive}.zip`;
    const pathToArchive = `/${truebug.server.path}/${remoteArchive}`;
    const url = `${truebug.server.hostname}/${pathToArchive}`;

    // log.info(`checking if there is "${remoteArchive}" on the server…`, 'start');

    // let archive_name = await new Promise((resolve) => {
    //     const opts = { method: 'HEAD' };
    //     const req = https.request(url, opts, (res) => {
    //         let archive_name;

    //         if (res.statusCode == 200) {
    //             const d = new Date(res.headers['last-modified']);
    //             //const time = d.toDateString().replace(/ /g, '-');
    //             const time = d.toISOString().split('T')[0];

    //             archive_name = `${typeOfArchive}.${time}`;
    //             stats.archives.typeOfArchive = typeOfArchive;
    //             stats.archives.timeOfArchive = time;
    //             stats.archives.sizeOfArchive = Number(res.headers['content-length']);
    //         }
    
    //         resolve(archive_name);
    //     });
        
    //     req.on('error', (error) => console.error(error));
    //     req.end();
    // });

    const timeOfArchive = checkServerForArchive(typeOfArchive);
    let archive_name;

    if (timeOfArchive) {
        //log.info(' yes, there is\n', 'end');
        archive_name = `${typeOfArchive}.${timeOfArchive}`;
        const localCopy = `${truebug.dirs.zips}/${archive_name}.zip`;

        //
        // Let's check if a local copy exists
        log.info(`checking for a local copy of "${remoteArchive}"…`, 'start');
        const exists = fs.existsSync(localCopy);

        if (!exists) {
            log.info(' there is none\n', 'end');
            log.info(`downloading "${typeOfArchive}" archive -> "${archive_name}.zip"…`, 'start');

            //
            // a local copy of the more recent archive does not
            // exist, so we will download it from the remote server
            //
            // https://stackoverflow.com/a/32134846/183692
            const d = await new Promise((resolve) => { 
                const file = fs.createWriteStream(localCopy);

                const request = https.get(url, (response) => {

                    // check if response is success
                    if (response.statusCode !== 200) {
                        return cb('Response status was ' + response.statusCode);
                    }

                    response.pipe(file);
                });

                // close() is async, call cb after close completes
                file.on('finish', () => {
                    file.close();
                    resolve(archive_name);
                });

                // check for request error too
                request.on('error', (err) => {

                    // delete the (partial) file and then return the error
                    fs.unlink(dest, () => cb(err.message)); 
                });

                // Handle errors
                file.on('error', (err) => { 

                    // delete the (partial) file and then return the error
                    fs.unlink(dest, () => cb(err.message)); 
                });
            });

            if (d) {
                log.info(' done\n', 'end');
            }
        }
        else {
            log.info(' yes, there is one\n', 'end');
        }
    }
    else {
        log.info(' there is none\n', 'end');
    }

    stats.downloads.ended = new Date().getTime();

    return archive_name;
}

const cleanOldArchive = (archive_name) => {
    console.log(`removing old archive ${archive_name}`);
    //fs.rmdirSync(archive_name, { recursive: true, force: true });
}



export { 
    unzip, 
    download,
    cleanOldArchive,
    checkServerForArchive
}