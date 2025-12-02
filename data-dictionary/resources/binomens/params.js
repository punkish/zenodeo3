export const params = [
    {
        name: 'binomen',
        schema: {
            type: 'string',
            description: `Binomen of species`
        },
        defaultOp: 'match',
        sql: {},
        defaultSort: 'ASC'
    },
    {
        name: "tokenize='trigram'",
        sql: {}
    }
]