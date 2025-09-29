import Newbug from '../newbug.js';

// import https from 'https';
// import http from 'http';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
// import { Readable } from 'stream';
// import { finished } from 'stream/promises';

//import stream from 'node:stream';
import { pipeline as streamPipeline } from 'node:stream/promises';
//import fs from 'node:fs';
import got from 'got';

export default class Download extends Newbug {
    constructor({ loglevel }) {
        super({ loglevel }); 
    }

    download = async (stats) => {
        stats.download.started = new Date().getTime();
        const typeOfArchive = stats.archive.typeOfArchive;

        const remoteArchive = typeOfArchive === 'yearly' 
            ? 'plazi.zenodeo.zip'
            : `plazi.zenodeo.${typeOfArchive}.zip`;
            
        // example
        //
        // "server": {
        //     "hostname": 'https://tb.plazi.org',
        //     "path": 'GgServer/dumps',
        //     "port": 443
        // },

        // https://tb.plazi.org/GgServer/dumps/plazi.zenodeo.daily.zip
        const pathToArchive = `${truebug.server.path}/${remoteArchive}`;
        const url = `${truebug.server.hostname}/${pathToArchive}`;
        this.log.info(`checking for "${remoteArchive}" on the server…`);

        try {
            const res = await got(url, { method: 'HEAD' });

            this.log.info(' yes, there is');
            const headers = res.headers;
            const d = new Date(headers['last-modified']);
            const timeOfArchive = d.toISOString().split('T')[0];
            const archive_name = `${typeOfArchive}.${timeOfArchive}`;
            const localCopy = `${truebug.dirs.zips}/${archive_name}.zip`;

            stats.archive.timeOfArchive = timeOfArchive;
            stats.archive.sizeOfArchive = Number(headers['content-length']);

            if (!fs.existsSync(localCopy)) {
                this.log.info(`downloading ${archive_name}…`);

                if (truebug.mode !== 'dryRun') {
                    await streamPipeline(
                        got.stream(url),
                        fs.createWriteStream(localCopy)
                    );
                }
            
            }

        }
        catch (error) {
            
            if (error.response.statusCode) {
                log.info(' there is not');
            }
            
        }
        
        stats.download.ended = new Date().getTime();
    }

    unzip = (stats) => {
        stats.unzip.started = new Date().getTime();

        const typeOfArchive = stats.archive.typeOfArchive;
        const timeOfArchive = stats.archive.timeOfArchive;

        const archive_name = `${typeOfArchive}.${timeOfArchive}`;
        this.log.info(
            `checking if "${archive_name}" has already been unzipped…`, 
            'start'
        );

        const archive_dir = `${truebug.dirs.data}/treatments-dumps/${archive_name}`;
        
        if (fs.existsSync(archive_dir)) {
            this.log.info(' yes, it has been');
        }
        else {
            this.log.info("no, it hasn't");
            this.log.info(`unzipping "${archive_name}.zip"…`);
            const archive = `${truebug.dirs.zips}/${archive_name}.zip`;
        
            // -q Perform operations quietly.
            // -n never overwrite existing files
            // -d extract files into exdir
            const cmd = `unzip -q -n ${archive} -d ${archive_dir}`;
        
            if (truebug.mode !== 'dryRun') {
                execSync(cmd);
                
                // check if there is an index.xml included in the archive; 
                // if yes, remove it
                if (fs.existsSync(`${archive_dir}/index.xml`)) {
                    fs.rmSync(`${archive_dir}/index.xml`);
                }
            }

        }

        const files = fs.readdirSync(archive_dir)
            .filter(f => path.extname(f) === '.xml');

        stats.unzip.numOfFiles = files.length;
        stats.unzip.ended = new Date().getTime();
        this.log.info(`downloaded archive contains ${files.length} files`);

        return files;
    }

    // https://stackoverflow.com/a/74722818/183692
    cleanOldArchive = (stats) => {
        const typeOfArchive = stats.archive.typeOfArchive;
        const timeOfArchive = stats.archive.timeOfArchive;

        const old_archives = fs.readdirSync(`${truebug.dirs.data}/treatments-dumps`);

        const typesOfArchives = [
            'yearly',
            'monthly',
            'weekly',
            'daily'
        ];

        old_archives.forEach(a => {
            const [ oldTypeOfArchive, oldTimeOfArchive ] = a.split('.');

            if (typesOfArchives.includes(oldTypeOfArchive)) {
                const cond1 = oldTypeOfArchive === typeOfArchive;
                const cond2 = oldTimeOfArchive !== timeOfArchive;
        
                if (cond1 && cond2) {
                    log.info(`removing old archive "${a}"`);

                    if (truebug.mode !== 'dryRun') {
                        fs.rmSync(
                            `${truebug.dirs.data}/treatments-dumps/${a}`, 
                            { 
                                recursive: true, 
                                force: true 
                            }
                        );
                    }
                    
                }
                else {
                    log.info(`not removing latest archive "${a}"`);
                }
            }
            
        })
        
    }
}