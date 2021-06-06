'use strict'

const fs = require('fs')
const execSync = require('child_process').execSync
const chalk = require('chalk')

const config = require('config')
const DATADIR = config.get('truebug.dataDir')
const DUMP = config.get('truebug.treatmentsDump')
const HOST = config.get('truebug.host')
const DOWNLOADS = config.get('truebug.downloads')

const { getDateOfLastEtl } = require('./database')

const _download = function({ opts, remote, local }) {
    console.log(`downloading ${chalk.bold(remote)}`)
    console.log(`curl --output ${local} '${remote}'`)
    if (opts.runtype === 'real') execSync(`curl --output ${local} '${remote}'`)
}

const unzip = function({ opts, archive }) {    
    console.log('unzipping')
    console.log(`   - ${chalk.bold(archive)}`)
    if (opts.runtype === 'real') execSync(`unzip -q -n ${archive} -d ${DUMP}`)
    opts.etl.downloaded = Number(execSync(`unzip -Z -1 ${archive} | wc -l`).toString().trim())
}

const download = function(opts) {
    if (opts.source === 'full') {
        _download({ 
            opts: opts, 
            remote: `${HOST}/dumps/${DOWNLOADS.full.file}`,
            local: `${DATADIR}/${DOWNLOADS.full.file}`
        })

        unzip({ opts: opts, archive: `${DOWNLOADS.full.file}` })    
    }
    else if (opts.source === 'diff') {
        const dateOfLastEtl = getDateOfLastEtl()
        const local = `treatments-list-${dateOfLastEtl}.json`
        let remote = `${HOST}/${DOWNLOADS.diff.file}`
        if (HOST === 'http://tb.plazi.org/GgServer') remote += `%22${dateOfLastEtl}%22`

        _download({
            opts: opts, 
            remote: remote,
            local: `${DATADIR}/${local}` 
        })
    
        const treatments = JSON.parse(fs.readFileSync(local, 'utf-8')).data

        treatments.forEach(t => {
            let remote = `${HOST}/xml/${t.DocUuid}`
            if (HOST === 'http://127.0.0.1/plazi/data') remote += '.xml'
            _download({ 
                opts: opts,
                remote: remote, 
                local: `${DUMP}/${t.DocUuid}.xml`
            })
        })

        opts.etl.downloaded = treatments.length
    }

    // 'opts.source' is a guid (a single treatment)
    else if (/^[A-Za-z0-9]{32}$/.test(opts.source)) {
        let remote = `${HOST}/${DOWNLOADS.xml.file}/${opts.source}`
        if (HOST === 'http://127.0.0.1/plazi/data') remote += '.xml'
        _download({ 
            opts: opts,
            remote: `${HOST}/${DOWNLOADS.xml.file}/${opts.source}.xml`, 
            local: `${DUMP}/${opts.source}.xml`
        })

        opts.etl.downloaded = 1
    }

    console.log('\n')
    console.log('='.repeat(75))
}

module.exports = download