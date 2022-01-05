'use strict'

const execSync = require('child_process').execSync;
const fs = require('fs');

const config = require('config');
const truebug = config.get('truebug');

const Logger = require('../utils');
const log = new Logger(truebug.log);

const unzip = function(source) {    
    log.info(`unzipping ${source} archive`);

    const archive = `${truebug.dirs.data}/${truebug.download[source]}`;
    const cmd = `unzip -q -n ${archive} -d ${truebug.dirs.dump}`;

    if (truebug.run === 'real') {
        execSync(cmd);
        let numOfFiles = Number(execSync(`unzip -Z -1 ${archive} | wc -l`).toString().trim());

        // check if there is an index.xml included in the archive; if yes, remove it
        const idx = `${truebug.dirs.dump}/index.xml`
        if (fs.existsSync(idx)) {
            fs.rmSync(idx);
            numOfFiles--;
        }

        log.info(`downloaded ${numOfFiles} files`);

        return numOfFiles;
    }
}

// const remoteFileExists = (remote) => {

//     // https://matthewsetter.com/check-if-file-is-available-with-curl/
//     const cmd = `curl -o /dev/null -sIw '%{http_code}' '${remote}'`;
//     const remoteExists = execSync(cmd);

//     if (String(remoteExists) === '200') {
//         log.info('remote file exists');
//         return true;
//     }
//     else {
//         log.info("remote file doesn't exist");
//         return false;
//     }
// }

const download = (source) => {
    const local = `${truebug.dirs.data}/${truebug.download[source]}`;
    const remote = `${truebug.server}/${truebug.download[source]}`;
    console.log(`remote: ${remote}`);
    if (truebug.run === 'real') {
        //if (remoteFileExists(remote)) {
            log.info(`downloading ${source} archive`);
            execSync(`curl -s -o ${local} '${remote}'`);
            //return true;
        // }
        // else {
        //     return false;
        // }
    }
}

module.exports = { download, unzip }