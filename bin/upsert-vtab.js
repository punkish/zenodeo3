'use strict'

const Database = require('better-sqlite3')
const db = new Database('foo.sqlite')

const tables = [
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

const data = [
    {
        treatmentId: 'a123',
        fulltext: 'blah blah blah'
    },
    {
        treatmentId: 'a124',
        fulltext: 'blah bloo blah'
    },
    {
        treatmentId: 'a125',
        fulltext: 'bloo bloo blah'
    },
]

const insertStatements = {}

const prepareDb = (db, tables, insertStatements) => {
    tables.forEach(t => {
        db.prepare(t.create).run()

        insertStatements[t.name] = {}
    
        if (t.type === 'virtual') {
            insertStatements[t.name].bulk = db.prepare(t.insert.bulk)
            insertStatements[t.name].row = {
                select: db.prepare(t.insert.row.select),
                update: db.prepare(t.insert.row.update),
                insert: db.prepare(t.insert.row.insert)
            }
        }
        else {
            insertStatements[t.name].insert = db.prepare(t.insert)
        }
    })
}

prepareDb(db, tables, insertStatements)


const insertData = (db, data, insertStatements) => {
    console.log('FIRST RUN')
    const insertMany = db.transaction((rows) => {
        for (const row of rows) {
            console.log(`inserting into treatments ${JSON.stringify(row)}`)
            insertStatements.treatments.insert.run(row)
        }
    })

    insertMany(data)

    // first FTS insert
    console.log('inserting bulk vtreatments')
    insertStatements.vtreatments.bulk.run()
}


// first run
insertData(db, data, insertStatements)

const data2 = JSON.parse(JSON.stringify(data))
data2[1].fulltext = 'changed this'

data2.push({
    treatmentId: 'a126',
    fulltext: 'bumpety bump'
})

// // subsequent insert
const insertData2 = (db, data, insertStatements) => {
    console.log('SECOND RUN')
    const insertMany = db.transaction((rows) => {
        for (const row of rows) {
            console.log(`inserting into treatments ${JSON.stringify(row)}`)
            insertStatements.treatments.insert.run(row)
        }
    })

    insertMany(data)

    // FTS upsert
    data.forEach(row => {
        try {
            console.log(insertStatements.vtreatments.row.select)
            const res = insertStatements.vtreatments.row.select.get(row).c
            //console.log(res)

            if (res) {
                console.log(`updating ${JSON.stringify(row)}`)
                console.log('-'.repeat(50))
                insertStatements.vtreatments.row.update.run(row)
            }
            else {
                console.log(`inserting ${JSON.stringify(row)}`)
                console.log('*'.repeat(50))
                insertStatements.vtreatments.row.insert.run(row)
            }
        }
        catch (error) {
            console.log(error)
        }
        
        
    })
}

insertData2(db, data2, insertStatements)