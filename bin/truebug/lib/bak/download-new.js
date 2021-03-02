'use strict'

const opts = {
    dryrun: true,
    download: 'diff',
    database: false,
    parse: false,
    rearrange: false
}

const fs = require('fs')
const execSync = require('child_process').execSync
const config = require('config')
const chalk = require('chalk')

/*
+-------------------+            +------------------+                                        
| plazi.zenodeo.zip |--- curl -->|plazi.zenodeo.zip |                                        
+-------------------+            +------------------+                                        
                                           |                                                 
                                           |                                                 
                                           |                                                  
                                         unzip                                               
                                           |                                               
                                           |                                                 
                                           v                                                 
+-------------------+            +------------------+                 +---------------------+
|       <xml>       |--- curl -->| treatments-dump  |--- rearrange -->| treatments-archive  |
+-------------------+            +------------------+                 +---------------------+
                                         \ ^ /
                                          \|/                                                
                                           |                                                 
                                           |                                               
                                          curl                                               
                                           |                                               
                                           |                                                 
+-------------------+            +------------------+                                        
|   <diff>-<date>   |--- curl -->| treatments-list  |                                        
+-------------------+            +------------------+                                        
*/

const execute = function({ isDryrun, msg, cmd_disp, cmd_exec }) {
    isDryrun ? console.log(msg, `\n  $ ${cmd_disp}\n`) : execSync(cmd_exec)
}

const checkIfDumpExists = function({ isDryrun, dump }) {

    // back up the dump directory if it exists
    if (fs.existsSync(dump)) {
        const dumpOld = `${dump}-old`

        execute({ 
            isDryrun: isDryrun, 
            msg: `backing ${chalk.bold(dump)} to ${chalk.bold(dumpOld)}`,
            cmd_disp: `${chalk.bold('mv')} ${chalk.green(dump)} ${chalk.red(dumpOld)}`,
            cmd_exec: `mv ${dump} ${dumpOld}`
        })
    }

    // create the dump directory
    else {
        execute({ 
            isDryrun: isDryrun, 
            msg: `creating ${chalk.bold(dump)}`,
            cmd_disp: `${chalk.bold('fs.mkdirSync(')}"${chalk.green(dump)}"${chalk.bold(')')}`,
            cmd_exec: `fs.mkdirSync(${dump})`
        })
    }
}

const download = function({ isDryrun, source, target }) {
    execute({ 
        isDryrun: isDryrun, 
        msg: `downloading ${chalk.bold(source)}`,
        cmd_disp: `${chalk.bold('curl --output')} ${chalk.green(target)} ${chalk.green(source)}`,
        cmd_exec: `curl --output ${target} ${source}`
    })
}

const unzip = function({ isDryrun, source, dump }) {
    execute({ 
        isDryrun: isDryrun, 
        msg: `unzipping ${chalk.bold(source)} to ${chalk.bold(dump)}`,
        cmd_disp: `${chalk.bold('unzip -q -n')} ${chalk.green(source)} ${chalk.bold('-d')} ${chalk.red(dump)}`,
        cmd_exec: `unzip -q -n ${source} -d ${dump}`
    })
}

const getSource = function(downloadType) {
    if (downloadType === 'full' || downloadType === 'diff') {
        return config.get('truebug.downloads')[downloadType]
    }
    else {
        return downloadType
    }
}

const getDateStamp = function() {

    // a date-time stamp that looks like 
    // `[yyyy-mm-dd]-[hh]h[mm]m[ss]s`
    return new Date()
            .toISOString()
            .replace(/\..+/, '')
            .replace(/T(\d\d):(\d\d):(\d\d)/, '-$1h$2m$3s')
}

const getDateOfLastUpdate = function() {
    return '2021-02-11'
}

const downloadAndUnzip = function({ opts, hostname, dump }) {
    const downloadType = opts.download
    const isDryrun = opts.dryrun

    const source = getSource(downloadType)

    if (downloadType === 'full') {
        checkIfDumpExists({ isDryrun: isDryrun, dump: dump })
    
        download({ 
            isDryrun: isDryrun, 
            source: `${hostname}/dumps/${source}`,
            target: source
        })

        unzip({ isDryrun: isDryrun, source: source, dump: dump })    
    }
    else if (downloadType === 'diff') {
        const dateOfLastUpdate = getDateOfLastUpdate()
        const target = `treatments-list-${dateOfLastUpdate}.json`

        download({ 
            isDryrun: isDryrun, 
            source: `${hostname}/${source}%22${dateOfLastUpdate}%22`, 
            target: target 
        })
    
        const treatments = fs.readFileSync(target).data
        treatments.forEach(t => {
            download({ 
                isDryrun: isDryrun, 
                source: `${hostname}/${DocUuid}`, 
                target: dump 
            })
        })
    
    }
    else if (downloadType.length === 32) {
        download({ 
            isDryrun: isDryrun, 
            source: `${hostname}/xml/${downloadType}`, 
            target: dump 
        })
    }
}

downloadAndUnzip({
    opts: opts,
    hostname: config.get('truebug.hostname'),
    dump: config.get('truebug.treatmentsDump'),
})