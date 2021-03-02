'use strict'

const fs = require('fs')
const execSync = require('child_process').execSync
const chalk = require('chalk')

const config = require('config')
const DUMP = config.get('truebug.treatmentsDump')
const HOST = config.get('truebug.host')
const DOWNLOADS = config.get('truebug.downloads')

const { getDateOfLastEtl } = require('./database')

const _download = function({ opts, remote, local }) {
    console.log(`   - ${chalk.bold(remote)}`)
    if (!opts.dryrun) execSync(`curl --output ${local} '${remote}'`)
}

const unzip = function({ opts, archive }) {    
    console.log('unzipping')
    console.log(`   - ${chalk.bold(archive)}`)
    if (!opts.dryrun) execSync(`unzip -q -n ${archive} -d ${DUMP}`)
    opts.etl.downloaded = execSync(`unzip -Z -1 ${archive} | wc -l`).toString().trim()
}

const download = function(opts) {
    console.log(`downloading`)

    if (opts.download === 'full') {
        _download({ 
            opts: opts, 
            remote: `${HOST}/${DOWNLOADS.full.file}`,
            local: DOWNLOADS.full.file
        })

        unzip({ opts: opts, archive: `${DOWNLOADS.full.file}` })    
    }
    else if (opts.download === 'diff') {
        const dateOfLastEtl = getDateOfLastEtl()
        const local = `treatments-list-${dateOfLastEtl}.json`
        let remote = `${HOST}/${DOWNLOADS.diff.file}`
        if (HOST === 'http://tb.plazi.org/GgServer') remote += `%22${dateOfLastEtl}%22`

        _download({
            opts: opts, 
            remote: remote,
            local: local 
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

    // 'opts.download' is a guid (a single treatment)
    else if (/^[A-Za-z0-9]{32}$/.test(opts.download)) {
        _download({ 
            opts: opts,
            remote: `${HOST}/${DOWNLOADS.diff.file}/${opts.download}`, 
            target: `${DUMP}/${opts.download}.xml`
        })

        opts.etl.downloaded = 1
    }

    console.log('\n')
    console.log('='.repeat(75))
}

module.exports = download