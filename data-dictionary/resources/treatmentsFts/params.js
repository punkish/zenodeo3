export const params = [
    {
        name: 'fulltext',
        schema: {
            type: 'string',
            description: `A snippet extracted from the fulltext of the treatment. Can use the following syntax: 
- \`q=spiders\``
        },
        defaultOp: 'match',
        sql: {}
    },
    {
        name: "content='treatments'",
        sql: {}
    },
    {
        name: "content_rowid='id'",
        sql: {}
    },
    {
        name: 'q',
        selname: `snippet(treatmentsFts, 0, '<span class="match">', '</span>', '…', 25) AS snippet`,
        schema: {
            type: 'string',
            description: `A snippet extracted from the full text of the treatment. Can use the following syntax: 
- \`q=spiders\``
        },
        zqltype: 'expression',
        defaultOp: 'match',
        defaultCol: false
    }
]