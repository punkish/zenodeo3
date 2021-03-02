'use strict'

const chalk = require('chalk')
const path = require('path')

const setOpts = function(args) {
    
    const opts = {
        download : false,
        rearrange: false,
        database : false,
        parse    : false,
        usage    : false,
        dryrun   : false
    }

    if (args.dryrun)    opts.dryrun    = true
    if (args.usage)     opts.usage     = true
    if (args.rearrange) opts.rearrange = true
    if (args.database)  opts.database  = true
    if (args.parse)     opts.parse     = args.parse

    if (args.download) {
        if (args.download === 'full' || args.download === 'diff' || args.download.length == 32) {
            opts.download = args.download
        }
    }

    opts.allParamsFalse = true

    if (opts.download || opts.rearrange || opts.database || opts.parse) {
        opts.allParamsFalse = false
    }
    
    return opts
}

const runOpts = function(opts) {
    
    const title = chalk.blue.bold('truebug v. 2.0.1')
    const usage = chalk.magentaBright(`Usage: truebug \\
        --usage     false \\
        --download  false | [ full | diff | <guid> ] \\
        --rearrange false | true \\
        --database  false | true \\
        --parse     false | all | n = number of treatments to parse | treatment_id`)

    if (opts.usage) {
        console.log(`
    ${title}
    ${usage}
    `)
    }

    if (opts.allParamsFalse) {

        const message = chalk.magenta(`truebug is an ETL program that can download treatments incrementally (those
    changed since it was run last), parse the XMLs, insert the data into the 
    database, and rearrange the treatments into a hierarchical directory 
    structure so any single folder doesn't have too many treatments.

    The default action is to do nothing as all options default to false;
        
    truebug will change its working directory to ~/zenodeo root and run 
    from there. The treatments will be downloaded and unzipped to a 
    directory called ~/zenodeo/data/treatments-[yyyy-mm-dd]T[hh]h[mm]m[ss]s
        
    --parse can be a treatment_id (GUID), or a number (for the number of 
    treatments to parse) or the word 'all' to parse all the treatments.`)

        const examples = chalk.green(`Examples:

        1. Parse specific XMLs

        % truebug --parse 038787DAFFF7FF904BBFF925FD13F9AA
        % truebug --parse 730087F21E00FF81FF61FC34FDA561A5

        2. Parse 5000 XMLs from the treatments dump directory

        % truebug --parse 5000

        3. Parse all the XMLs in the treatments dump directory

        % truebug --parse 'all'

        4. Parse all XMLs, insert them in the database, and rearrange them 
        in the treatments directory in a hierachical directory structure so 
        they are easy to work with in the filesystem

        % truebug --parse 'all' --database true --rearrange true`)

        
        console.log(`
    ${title}
    ${usage}

    ${message}

    ${examples}
    `)

    }
    else {

        // make sure the process runs from ~/zenodeo 
        process.chdir(path.dirname(process.argv[1]))
        
        // now go up one
        process.chdir('../../');
        
        // ready
        return true
        
    }
}

module.exports = { setOpts, runOpts }