export const params = [
    {
        name: 'id',
        schema: {},
        sql: {
            desc: 'Primary Key'
        },
        defaultCol: false,
        notQueryable: true,
        indexed: false
    },
    {
        name: 'minX',
        schema: {},
        sql: {
            desc: 'lower left longitude'
        },
        defaultCol: false,
        notQueryable: true,
        indexed: false
    },
    {
        name: 'maxX',
        schema: {},
        sql: {
            desc: 'upper right longitude'
        },
        defaultCol: false,
        notQueryable: true,
        indexed: false
    },
    {
        name: 'minY',
        schema: {},
        sql: {
            desc: 'lower left latitude'
        },
        defaultCol: false,
        notQueryable: true,
        indexed: false
    },
    {
        name: 'maxY',
        schema: {},
        sql: {
            desc: 'upper right latitude'
        },
        defaultCol: false,
        notQueryable: true,
        indexed: false
    },
    {
        name: '+materialCitations_id',
        schema: {},
        sql: {
            desc: 'ID of parent materialCitation',
            type: 'INTEGER NOT NULL'
        },
        defaultCol: false,
        notQueryable: true,
        indexed: false
    },
    {
        name: '+treatments_id',
        schema: {},
        sql: {
            desc: 'ID of parent treatment',
            type: 'INTEGER NOT NULL'
        },
        defaultCol: false,
        notQueryable: true,
        indexed: false
    }
]