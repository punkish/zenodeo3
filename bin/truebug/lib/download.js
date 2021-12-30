'use strict'

const execSync = require('child_process').execSync;
const fs = require('fs');

const config = require('config');
const truebug = config.get('truebug');

const Logger = require('../utils');
const log = new Logger({
    level: truebug.log.level, 
    transports: truebug.log.transports, 
    logdir: truebug.dirs.logs
});

const unzip = function(downloadtype) {    
    log.info(`unzipping ${downloadtype} archive`);

    const archive = `${truebug.dirs.data}/${truebug.download[downloadtype]}`;
    const cmd = `unzip -q -n ${archive} -d ${truebug.dirs.dump}`;

    if (truebug.run === 'real') {
        execSync(cmd);
        let numOfFiles = Number(execSync(`unzip -Z -1 ${archive} | wc -l`).toString().trim());

        // check if there is an index.xml included in the archive; if yes, remove it
        const idx = `${truebug.dirs.dump}/index.xml`
        if (fs.existsSync(idx)) {
            fs.rmSync(idx);
            numOfFiles--
        }

        log.info(`downloaded ${numOfFiles} files`);

        return numOfFiles;
    }
}

const download = (downloadtype) => {
    log.info(`downloading ${downloadtype} archive`);

    const local = `${truebug.dirs.data}/${truebug.download[downloadtype]}`;
    const remote = `${truebug.server}/${truebug.download[downloadtype]}`;
    const cmd = `curl --silent --output ${local} '${remote}'`;
    //if (truebug.run === 'real') execSync(cmd);
}

module.exports = { download, unzip }