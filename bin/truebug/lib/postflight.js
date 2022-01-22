'use strict'

const config = require('config');
const truebug = config.get('truebug');

const Logger = require('../utils');
const log = new Logger(truebug.log);

const fs = require('fs');
const path = require('path');

const fileaway = (xml) => {        
    const src = `${config.get('truebug.dirs.dump')}/${xml}`;

    const one = xml.substr(0, 1);
    const two = xml.substr(0, 2);
    const thr = xml.substr(0, 3);
    const dst = `${config.get('truebug.dirs.archive')}/${one}/${two}/${thr}`;

    const cleanname = xml.replace(/\.\./, '.');
    const tgt = `${dst}/${cleanname}`;

    const cmd1 = `fs.mkdirSync('${dst}', {recursive: true})`;
    const cmd2 = `fs.copyFileSync('${src}', '${tgt}')`;
    const cmd3 = `fs.rmSync('${src}')`;
    
    if (truebug.run === 'real') {
        eval(cmd1)
        eval(cmd2)
        eval(cmd3)
    }
}

module.exports = { fileaway }