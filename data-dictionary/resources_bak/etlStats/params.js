export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        }
    },
    {
        name: 'started',
        schema: { 
            type: 'string', 
            description: ''
        },
        sql: {
            type: 'INTEGER',
            desc: 'Time ETL process started in UTC ms since epoch'
        },
        zqltype: 'date'
    },
    {
        name: 'ended',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            type: 'INTEGER',
            desc: 'Time ETL process ended in UTC ms since epoch'
        },
        zqltype: 'date'
    },
    {
        name: 'process',
        schema: { 
            type: 'TEXT COLLATE NOCASE', 
            description: ''
        },
        sql: {
            type: 'TEXT COLLATE NOCASE',
            desc: "Type of process ('download' or 'etl')"
        }
    },
    {
        name: 'typeOfArchive',
        schema: { 
            type: 'string', 
            enum: [ 'full', 'monthly', 'weekly', 'daily' ],
            description: ''
        },
        sql: {
            type: 'TEXT COLLATE NOCASE',
            desc: 'The type of archive'
        }
    },
    {
        name: 'timeOfArchive',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            type: 'INTEGER',
            desc: 'Time when the archive was created in UTC ms since epoch'
        },
        indexed: false
    },
    {
        name: 'sizeOfArchive',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            type: 'INTEGER',
            desc: 'Size of the archive in kilobytes'
        },
        indexed: false
    },
    {
        name: 'numOfFiles',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            type: 'INTEGER',
            desc: 'Number of files in the archive'
        },
        indexed: false
    },
    {
        name: 'treatments',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            type: 'INTEGER',
            desc: 'Number of treatments in the archive'
        },
        indexed: false
    },
    {
        name: 'treatmentCitations',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            type: 'INTEGER',
            desc: 'Number of treatmentCitations in the archive'
        },
        indexed: false
    },
    {
        name: 'materialCitations',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            type: 'INTEGER',
            desc: 'Number of materialCitations in the archive'
        },
        indexed: false
    },
    {
        name: 'figureCitations',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            type: 'INTEGER',
            desc: 'Number of figureCitations in the archive'
        },
        indexed: false
    },
    {
        name: 'bibRefCitations',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            type: 'INTEGER',
            desc: 'Number of bibRefCitations in the archive'
        },
        indexed: false
    },
    {
        name: 'treatmentAuthors',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            type: 'INTEGER',
            desc: 'Number of authors in the archive'
        },
        indexed: false
    },
    {
        name: 'collectionCodes',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            type: 'INTEGER',
            desc: 'Number of collection codes in the archive'
        },
        indexed: false
    },
    {
        name: 'journals',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            type: 'INTEGER',
            desc: 'Number of journals in the archive'
        },
        indexed: false
    }
]