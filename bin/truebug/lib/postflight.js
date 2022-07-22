'use strict'

import { pathToXml } from './utils.js';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;

import { Zlogger } from '@punkish/zlogger';
const logOpts = JSON.parse(JSON.stringify(config.truebug.log));
logOpts.name = 'TRUEBUG:POSTFLIGHT';
const log = new Zlogger(logOpts);

import fs from 'fs';

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

export { fileaway }