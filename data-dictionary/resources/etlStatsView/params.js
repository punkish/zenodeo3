export const params = [
    {
        name: `datetime("started" / 1000, 'unixepoch') AS start`,
        schema: {},
        sql: {
            desc: 'the time the process started',
            type: ''
        },
        defaultCol: false,
        queryable: false,
        indexed: false
    },
    {
        name: `datetime("ended" / 1000, 'unixepoch') AS end`, 
        schema: {},
        sql: {
            desc: 'the time the process ended',
            type: ''
        },
        defaultCol: false,
        queryable: false,
        indexed: false
    },
    {
        name: '("ended" - "started") AS duration', 
        schema: {},
        sql: {
            desc: 'the duration of the process',
            type: ''
        },
        defaultCol: false,
        queryable: false,
        indexed: false
    },
    {
        name: '"process"',
        schema: {},
        sql: {
            desc: 'the name of the process',
            type: ''
        },
        defaultCol: false,
        queryable: false,
        indexed: false
    }
]