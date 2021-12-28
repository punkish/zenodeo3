'use strict'

/*
a db has one or more tables
a table has one or more columns
each column has a data type
each table has one PK
each table has zero or more UNIQUE constraints
each resource (table or view) has attributes (columns or calculated columns)
*/

const tables = {
    mc: `CREATE TABLE IF NOT EXISTS mc.materialsCitations ( 
        id INTEGER PRIMARY KEY,
        materialsCitationId TEXT NOT NULL,
        treatmentId TEXT NOT NULL,
        created INTEGER DEFAULT (strftime('%s','now')),
        UNIQUE (materialsCitationId, treatmentId)
    )`,

    mxc: `CREATE TABLE IF NOT EXISTS mc.materialsCitations_x_collectionCodes ( 
        id INTEGER PRIMARY KEY,
        materialsCitationId TEXT,
        collectionCode TEXT,
        created INTEGER DEFAULT (strftime('%s','now')),
        updated INTEGER,
        UNIQUE (collectionCode, materialsCitationId)
    )`,

    cc: `CREATE TABLE IF NOT EXISTS mc.collectionCodes ( 
        id INTEGER PRIMARY KEY,
        collectionCode TEXT NOT NULL UNIQUE,
        created INTEGER DEFAULT (strftime('%s','now')),
        updated INTEGER
    )`
}