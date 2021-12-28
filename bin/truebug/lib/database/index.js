'use strict'

const Logger = require('../../utils')
const level = 'info'
const transports = [ 'console', 'file' ]
const logdir = '/Users/punkish/Projects/zenodeo/zenodeo3/bin/truebug/logs'
const log = new Logger({level, transports, logdir})

const Database = require('better-sqlite3')
const config = require('config')
const db = new Database(config.get('db.main'))
const dbs = require('./dbs')

//const { getResourceid } = require('../../../../data-dictionary/dd-utils')

const prepareSeparateDatabases = (truebug) => {
    dbs.forEach(d => {
        const dbfile = config.get(`db.attached.${d.name}`)
        log.info(`attaching database '${d.name}'`)
        if (truebug.run === 'real') db.prepare(`ATTACH DATABASE '${dbfile}' AS ${d.alias}`).run()

        if (d.tables) {
            log.info('creating tables and insert statements')
            const tables = d.tables
    
            tables.forEach(t => {
                log.info(`  - ${d.name}.${t.name}`)
                if (truebug.run === 'real') {
                    db.prepare(t.create).run()

                    truebug.insertStatements[t.name] = {}
    
                    if (t.type === 'virtual') {
                        truebug.insertStatements[t.name].bulk = db.prepare(t.insert.bulk)
                        truebug.insertStatements[t.name].row = {
                            select: db.prepare(t.insert.row.select),
                            update: db.prepare(t.insert.row.update),
                            insert: db.prepare(t.insert.row.insert)
                        }
                    }
                    else {
                        if (t.insert) {
                            truebug.insertStatements[t.name].insert = db.prepare(t.insert)
                        }
                    }

                    // truebug.insertStatements[t.name] = {
                    //     rows: {
                    //         insert: '',
                    //         update: ''
                    //     },
                    //     bulk: ''
                    // }

                    // if (t.type && t.type === 'virtual') {
                    //     truebug.insertStatements[t.name].rows.insert = db.prepare(t.insert.row)
                    //     truebug.insertStatements[t.name].rows.update = db.prepare(t.update.row)
                    //     truebug.insertStatements[t.name].bulk = db.prepare(t.insert.bulk)
                    // }
                    // else {
                    //     if (t.insert) {
                    //         truebug.insertStatements[t.name].rows = db.prepare(t.insert)
                    //     }
                    // }
                }
            })
        }
    })
}

// const prepareSingleDatabase = (truebug) => {
//     dbs.forEach(d => {
//         if (d.tables) {
//             log.info('creating tables and insert statements')
//             const tables = d.tables
    
//             tables.forEach(t => {
//                 log.info(`  - ${d.alias}${t.name}`)
//                 if (truebug.run === 'real') {
//                     db.prepare(t.create).run()
//                     if (t.type && t.type === 'virtual') {
//                         truebug.insertStatements.row[t.name] = db.prepare(t.insert.row)
//                         truebug.insertStatements.bulk[t.name] = db.prepare(t.insert.bulk)
//                     }
//                     else {
//                         if (t.insert) {
//                             truebug.insertStatements.row[t.name] = db.prepare(t.insert)
//                         }
//                     }
//                 }
//             })
//         }
//     })
// }

const repackageData = (input, output) => {
    Object.entries(input).forEach(([key, value]) => {
        if (key === 'treatment') {
            output.treatments.push(value);
        }
        else {
            output[key].push(...value);
        }
    })

    return output;
}

const resetData = (data) => {
    for (let [k, v] of Object.entries(data)) {
        v.length = 0
    }
}

const insertData = (truebug, data) => {
    for (let table in data) {
        if (data[table].length) {
            const insertMany = db.transaction((rows) => {
                for (const row of rows) {  
                    try {
                        truebug.insertStatements[table].insert.run(row)
                    }
                    catch(error) {
                        log.error(error)
                        log.info(`table ${table}`)
                        log.info(`row: ${JSON.stringify(row)}`)
                    }
                }
            })

            insertMany(data[table])
        }
    }

    resetData(data)
}

const insertFTS = (truebug, ftstype, row) => {
    dbs.forEach(d => {
        if (d.tables) {
            const tables = d.tables
            tables.forEach(t => {
                if (t.type && t.type === 'virtual') {
                    log.info(`inserting ${ftstype} data in virtual table ${t.name}`)

                    if (ftstype === 'bulk') {
                        try {
                            truebug.insertStatements[t.name].bulk.run()
                        }
                        catch (error) { log.error(error) }
                    }
                    else {
                        try {
                            const res = truebug.insertStatements[t.name].row.select.get(row).c

                            if (res) {
                                truebug.insertStatements[t.name].row.update.run(row)
                            }
                            else {
                                truebug.insertStatements[t.name].row.insert.run(row)
                            }
                        }
                        catch (error) { log.error(error) }
                    }
                }
            })
        }
    })
}

const dropIndexes = (truebug) => {
    log.info('dropping indexes')
    dbs.forEach(d => {
        if (d.tables) {
            const tables = d.tables

            tables.forEach(t => {
                if (truebug.run === 'real') {
                    if ('indexes' in t) {
                        t.indexes.forEach(i => {
                            const ix = i.match(/\w+\.ix_\w+/)
                            let idx
                            if (ix) idx = ix[0]
                            db.prepare(`DROP INDEX IF EXISTS ${idx}`).run()
                        })
                    }
                }
            })
        }
    })
}

const buildIndexes = (truebug) => {
    log.info('building indexes')
    dbs.forEach(d => {
        if (d.tables) {
            const tables = d.tables

            tables.forEach(t => {
                if (truebug.run === 'real') {
                    if ('indexes' in t) {
                        t.indexes.forEach(i => {
                            try {
                                db.prepare(i).run()
                            }
                            catch(error) {
                                log.error(error)
                                log.error(i)
                            }
                        })
                    }
                }
            })
        }
    })
}

const selCountOfTreatments = () => db.prepare('SELECT Count(*) AS c FROM treatments').get().c
const selCountOfVtreatments = () => db.prepare('SELECT Count(*) AS c FROM vtreatments').get().c

const insertEtlStats = function(truebug, etlstats) {
    log.info('inserting ETL stats')
    if (truebug.run === 'real') {
        truebug.insertStatements.etlstats.insert.run(etlstats)
    }
}

module.exports = {
    prepareSeparateDatabases,
    //prepareSingleDatabase,
    selCountOfTreatments,
    selCountOfVtreatments,
    repackageData,
    dropIndexes,
    buildIndexes,
    insertData,
    insertFTS,
    insertEtlStats
}