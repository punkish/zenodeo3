export const params = [
    {
        name: 'refString',
        sql: {}
    },
    {
        name: "content='bibRefCitations'",
        sql: {}
    },
    {
        name: "content_rowid='id'",
        sql: {}
    },
    {
        name: 'q',
        selname: 'bibRefCitationsFts.refString',
        schema: {
            type: 'string',
            description: `The full text of the reference cited by the treatment. Can use the following syntax: 
- \`q=spiders\``
        },
        zqltype: 'expression',
        defaultOp: 'match',
        defaultCol: false
    }
]