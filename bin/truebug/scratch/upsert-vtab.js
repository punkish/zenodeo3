'use strict';

const config = require('config');
const dir = config.get('truebug.dirs.data');
const Database = require('better-sqlite3');
const db = new Database(`${dir}/foo.sqlite`);
const chance = require('chance').Chance();

/***** truebug/index ********/
const truebug = {
    run: 'real',
    insertStatements = {}
}

const processFiles = (files) => {

    /**************************************************************
     * 
     * update the progress bar every x% of the total num of files
     * but x% of j should not be more than 5000 because we don't 
     * want to insert more than 5K records at a time.
     * 
     **************************************************************/
    const totalFiles = files.length;
    const startingFile = 0;
    let i = startingFile;
    const batch = totalFiles < 50 ? Math.floor(totalFiles / 10) : 50;

    console.log(`parsing, inserting in db and refiling ${totalFiles} treatments ${batch} at a time`);

    let count = 0
    console.log(`${'~'.repeat(80)}\n`)

    const data = {
        treatments: [],
        // treatmentAuthors: [],
        // materialsCitations: [],
        // materialsCitations_x_collectionCodes: [],
        // collectionCodes: [],
        // treatmentCitations: [],
        // figureCitations: [],
        // bibRefCitations: []
    }

    for (; i < totalFiles; i++) {
        // const xml = files[i]
        // const treatment = parse.parseOne(truebug, xml)
        // parse.calcStats(treatment)
        // database.repackageData(treatment, data)
        data.treatments.push(files[i])

        if (!(i % batch)) {
            database.insertData(truebug, data)

            count++
            const done = (batch * count) + startingFile
            console.log(`${done > totalFiles ? totalFiles : done} … `)
        }

        if (i === totalFiles - 1) {
            console.log(' done\n', 'end')
        }

        //preflight.fileaway(truebug, xml)
    }

    // the last remaining files
    database.insertData(truebug, data)

    console.log(`${'~'.repeat(80)}\n`)
}

const etl = (truebug, files) => {
    // preflight.checkDir(truebug, 'archive')
    // preflight.checkDir(truebug, 'dump')
    
    //const files = preflight.filesExistInDump(truebug)
    //if (files.length) {
        //log.info(`${files.length} files exist… let's do something`)
        database.prepareDatabases(truebug)
    
        //database.dropIndexes(truebug)
        processFiles(files)
        //database.buildIndexes(truebug)

        
        database.insertFTS(truebug, data)
        // }
        // else {
        //     database.insertFTS(truebug, 'bulk')
        // }
        
        // console.log(`parsed ${parse.stats.treatments} files with`)
        // for (const [key, value] of Object.entries(parse.stats)) {
        //     console.log(`- ${value} ${key}`)
        // }
    // }
    // else {
    //     log.info('there are no files in the dump to process')
    // }

    //return 0
}

const dbs = [
    {
        tables: [
            {
                name: 'treatments',
                create: `CREATE TABLE IF NOT EXISTS treatments ( 
                    id INTEGER PRIMARY KEY,
                    treatmentId TEXT NOT NULL UNIQUE,
                    fulltext TEXT
                )`,
                insert: `INSERT INTO treatments (treatmentId, fulltext)
                VALUES (@treatmentId, @fulltext)
                ON CONFLICT (treatmentId)
                DO UPDATE SET fulltext=excluded.fulltext`
            },
            {
                name: 'vtreatments',
                type: 'virtual',
                create: `CREATE VIRTUAL TABLE IF NOT EXISTS vtreatments USING FTS5(treatmentId, fullText)`,
                insert: {
                    row: {
                        select: `SELECT Count(*) AS c FROM vtreatments WHERE treatmentId = @treatmentId`,
                        update: `UPDATE vtreatments SET fulltext = @fulltext WHERE treatmentId = @treatmentId`,
                        insert: `INSERT INTO vtreatments (treatmentId, fulltext) VALUES (@treatmentId, @fulltext)`
                    },
                    bulk: `INSERT INTO vtreatments SELECT treatmentId, fulltext FROM treatments`
                }
            }
        ]
    }
]

/******* truebug/database */
const database = {
    createData: (num) => {
        const data = { treatments: [] };
    
        [...Array(num)].forEach((item, idx) => {
            data.treatments.push({
                treatmentId: chance.guid(),
                fulltext: chance.sentence({ words: 5 })
            });
        })
    
        return data;
    },

    prepareDatabases: (truebug) => {
        dbs.forEach(d => {
            // const dbfile = config.get(`db.attached.${d.name}`)
            // log.info(`attaching database '${d.name}'`)
            // if (truebug.run === 'real') db.prepare(`ATTACH DATABASE '${dbfile}' AS ${d.alias}`).run()
    
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
                    }
                })
            }
        })
    },

    selCountOfVtreatments: () => db.prepare('SELECT Count(*) AS c FROM vtreatments').get().c,
    resetData: (data) => Object.values(data).forEach(v => v.length = 0),
    insertData: (truebug, data) => {
        for (let table in data) {
            const d = data[table];
            if (d.length) {
    
                /*
                 * Create a transaction function that takes an 
                 * array of rows and inserts them in the db 
                 * row by row.
                 */
                const insertMany = db.transaction((rows) => {
                    for (const row of rows) {  
                        try {
                            truebug.insertStatements[table].insert.run(row);
                        }
                        catch(error) {
                            log.error(error);
                            log.info(`table ${table}`);
                            log.info(`row: ${JSON.stringify(row)}`);
                        }
                    }
                })
    
                insertMany(d);
            }
        }
    
        resetData(data);
    },

    modifyData: (input) => {
        const data = JSON.parse(JSON.stringify(input))
    
        // modify an existing row
        data.treatments[1].fulltext = 'changed this'
        
        // add new row
        data.treatments.push({
            treatmentId: chance.guid(),
            fulltext: 'added this'
        })
    
        return data;
    },

    insertFTS: (truebug, data) => {
        dbs.forEach(d => {
            if (d.tables) {
                const tables = d.tables
                tables.forEach(t => {
                    if (database.selCountOfVtreatments(truebug)) {
                        try {
                            const res = truebug.insertStatements[t.name].row.select.get(row).c

                            if (res) {
                                truebug.insertStatements[t.name].row.update.run(row)
                            }
                            else {
                                truebug.insertStatements[t.name].row.insert.run(row)
                            }
                        }
                        catch (error) { 
                            console.log(error) 
                        }
                    }
                    else {
                        try {
                            truebug.insertStatements[t.name].bulk.run()
                        }
                        catch (error) { 
                            console.log(error) 
                        }
                    }
                })
            }
        })
    }
}

// const insertData2 = (db, data, insertStatements) => {
//     console.log('SECOND RUN')
//     const insertMany = db.transaction((rows) => {
//         for (const row of rows) {
//             console.log(`inserting into treatments ${JSON.stringify(row)}`)
//             insertStatements.treatments.insert.run(row)
//         }
//     })

//     insertMany(data)

//     // FTS upsert
//     data.forEach(row => {
//         try {
//             console.log(insertStatements.vtreatments.row.select)
//             const res = insertStatements.vtreatments.row.select.get(row).c
//             //console.log(res)

//             if (res) {
//                 console.log(`updating ${JSON.stringify(row)}`)
//                 console.log('-'.repeat(50))
//                 insertStatements.vtreatments.row.update.run(row)
//             }
//             else {
//                 console.log(`inserting ${JSON.stringify(row)}`)
//                 console.log('*'.repeat(50))
//                 insertStatements.vtreatments.row.insert.run(row)
//             }
//         }
//         catch (error) {
//             console.log(error)
//         }
        
        
//     })
// }

// first run
const data = createData(5703);
etl(truebug);


insertData(truebug, data);

// subsequent insert
const data2 = modifyData(data);
insertData2(truebug, data2);