'use strict'

import * as utils from './utils.js';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;
const ts = truebug.steps.postflight;

const logOpts = JSON.parse(JSON.stringify(truebug.log));
logOpts.name = 'TRUEBUG:POSTFLIGHT';

import fs from 'fs';

const cpFile = (archive, xml) => {
    const fn = 'cpFile';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);
    
    const archive_name = `${archive.typeOfArchive}.${archive.timeOfArchive}`;

    if (truebug.mode !== 'dryRun') {
        const tgt = utils.pathToXml(xml);

        if (!fs.existsSync(tgt)) {
            fs.mkdirSync(tgt, { recursive: true });

            const src = `${truebug.dirs.data}/treatments-dumps/${archive_name}/${xml}`;
            fs.copyFileSync(src, tgt);
        }
    }
}

const rmFile = (archive, xml) => {
    const fn = 'rmFile';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    const archive_name = `${archive.typeOfArchive}.${archive.timeOfArchive}`;

    if (truebug.mode !== 'dryRun') {
        const src = `${truebug.dirs.data}/treatments-dumps/${archive_name}/${xml}`;
        fs.rmSync(src);
    }
}

export { cpFile, rmFile }