export const params = [
    {
        name: 'id',
        schema: {},
        sql: {
            desc: 'Primary Key'
        },
        notDefaultCol: true,
        notQueryable: true,
        indexed: false
    },
    {
        name: 'minX',
        schema: {},
        sql: {
            desc: 'lower left longitude'
        },
        notDefaultCol: true,
        notQueryable: true,
        indexed: false
    },
    {
        name: 'maxX',
        schema: {},
        sql: {
            desc: 'upper right longitude'
        },
        notDefaultCol: true,
        notQueryable: true,
        indexed: false
    },
    {
        name: 'minY',
        schema: {},
        sql: {
            desc: 'lower left latitude'
        },
        notDefaultCol: true,
        notQueryable: true,
        indexed: false
    },
    {
        name: 'maxY',
        schema: {},
        sql: {
            desc: 'upper right latitude'
        },
        notDefaultCol: true,
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
        notDefaultCol: true,
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
        notDefaultCol: true,
        notQueryable: true,
        indexed: false
    }
]