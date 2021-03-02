'use strict'

let timer = process.hrtime()

const chalk = require('chalk')
const { setOpts, runOpts } = require('./lib/opts')
const { timerFormat } = require('../../lib/utils')
const { assignNames, checkIfDumpExists, checkIfArchiveExists, cleanUp } = require('./lib/preAndPostFlight')
const { downloadTreatments } = require('./lib/download')
const { createTables, buildIndexes } = require('./lib/database')
const { parseLoadRearrangefiles } = require('./lib/parse')

const argv = require('minimist')(process.argv.slice(2))

const opts = setOpts(argv)
const names = assignNames(opts)
const go = runOpts(opts)

if (go) {
    console.log('-'.repeat(75))
    console.log(chalk.bold('Truebug'), '–', new Date())
    if (opts.dryrun) chalk.yellow('This is a dry run')
    console.log('='.repeat(75),'\n')

    const extracted = {
        treatments: 0,
        treatmentCitations: 0,
        treatmentAuthors: 0,
        materialsCitations: 0,
        figureCitations: 0,
        bibRefCitations: 0
    }
    
    const steps = [
        {
            message: "Check dump",
            prereq: true,
            fn: checkIfDumpExists,
            args: { opts, names }
        },

        {
            message: "Check archive",
            prereq: true,
            fn: checkIfArchiveExists,
            args: { opts, names }
        },

        {
            message: "Download and unpack treatments",
            prereq: opts.download,
            fn: downloadTreatments,
            args: { opts, names }
        },

        // {
        //     message: "Unpack treatments",
        //     prereq: opts.download,
        //     fn: unpackTreatments,
        //     args: { opts, names }
        // },

        {
            message: "Create tables",
            prereq: opts.database,
            fn: createTables,
            args: { opts, names }
        },

        {
            message: "Parse, load and rearrange treatments",
            prereq: opts.parse,
            fn: parseLoadRearrangefiles,
            args: { opts, names, extracted }
        },

        {
            message: "Index tables",
            prereq: opts.database,
            fn: buildIndexes,
            args: { opts, names }
        },

        {
            message: "Clean up",
            prereq: true,
            fn: cleanUp,
            args: { opts, names }
        }
    ]

    steps.forEach(s => {
        if (s.prereq) {
            console.log(chalk.bold(s.message + '… '))
            s['fn'](s.args)
            console.log('-'.repeat(75))
        }
    })

    if (extracted) {
        console.log(chalk.bold('Stats'))
        console.log('-'.repeat(75))
        for (let k in extracted) {
            console.log(`   - ${k}: ${chalk.red(extracted[k])}`)
        }
    }
}

timer = process.hrtime(timer)
console.log('\n')
console.log('='.repeat(75))
console.log(`Time taken: ${timerFormat(timer).timeInEnglish}`)