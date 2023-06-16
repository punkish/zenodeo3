'use strict'

import * as utils from './utils.js';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;
const ts = truebug.steps.postflight;

const logOpts = JSON.parse(JSON.stringify(truebug.log));
logOpts.name = 'TRUEBUG:POSTFLIGHT';

import fs from 'fs';

const cpFile = (xml, stats) => {
    const fn = 'cpFile';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);
    
    const typeOfArchive = stats.archive.typeOfArchive;
    const timeOfArchive = stats.archive.timeOfArchive;
    const archive_name = `${typeOfArchive}.${timeOfArchive}`;

    if (truebug.mode !== 'dryRun') {
        const tgt = utils.pathToXml(xml);

        if (!fs.existsSync(tgt)) {
            fs.mkdirSync(tgt, { recursive: true });

            const src = `${truebug.dirs.data}/treatments-dumps/${archive_name}/${xml}`;
            fs.copyFileSync(src, tgt);
        }
    }
}

const rmFile = (xml, stats) => {
    const fn = 'rmFile';
    if (!ts[fn]) return;
    utils.incrementStack(logOpts.name, fn);

    const typeOfArchive = stats.archive.typeOfArchive;
    const timeOfArchive = stats.archive.timeOfArchive;
    const archive_name = `${typeOfArchive}.${timeOfArchive}`;

    if (truebug.mode !== 'dryRun') {
        const src = `${truebug.dirs.data}/treatments-dumps/${archive_name}/${xml}`;
        fs.rmSync(src);
    }
}

const printit = (stats) => {
    for (const s of stats) {
      for (const [k, v] of Object.entries(s)) {
        if (k === 'archive') {
          const size = v.sizeOfArchive / 1024 / 1024;
          console.log(`${k}: ${v.typeOfArchive}, ${v.timeOfArchive}, ${size.toFixed(2)} MB`);
          console.log('-'.repeat(50));
        }
  
        if (k === 'download') {
          const time = v.ended - v.started;
          console.log(`${k} took: ${time} ms`);
        }
  
        if (k === 'unzip') {
          console.log(`number of files: ${v.numOfFiles}`);
        }
  
        if (k === 'etl') {
          const time = v.ended - v.started;
          console.log(`etl took: ${time} ms`);
          delete(v.started);
          delete(v.ended);
          console.table(v);
        }
      }
    }
  }

export { cpFile, rmFile, printit }