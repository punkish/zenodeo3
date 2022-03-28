'use strict'

import config from 'config';
const truebug = config.get('truebug');

import { Zlogger } from '@punkish/zlogger';
const logOpts = JSON.parse(JSON.stringify(config.get('truebug.log')));
logOpts.name  = 'TRUEBUG:POSTFLIGHT';
const log     = new Zlogger(logOpts);

import fs from 'fs';
import path from 'path';

const pathToXml = (xml) => {
    const one = xml.substr(0, 1);
    const two = xml.substr(0, 2);
    const thr = xml.substr(0, 3);
    const dir = `${config.get('truebug.dirs.archive')}/${one}/${two}/${thr}`;

    return dir;
}

const fileaway = (xml) => {        
    const src = `${config.get('truebug.dirs.dump')}/${xml}`;

    if (truebug.run === 'real') {
        if (truebug.savexmls) {
            const tgt = pathToXml(xml);
            fs.mkdirSync(dst, { recursive: true });
            fs.copyFileSync(src, tgt);
        }

        fs.rmSync(src);
    }
}

module.exports = { fileaway }