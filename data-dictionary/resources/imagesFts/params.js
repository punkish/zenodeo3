export const params = [
    {
        name: 'captionText',
        schema: {
            type: 'string',
            description: `A snippet extracted from the caption of the image. Can use the following syntax: 
- \`q=spiders\``
        },
        defaultOp: 'match',
        sql: {}
    },
    {
        name: "content='images'",
        sql: {}
    },
    {
        name: "content_rowid='id'",
        sql: {}
    },
    {
        name: 'q',
        selname: `snippet(imagesFts, 0, '<span class="match">', '</span>', '…', 25) AS snippet`,
        where: 'imagesFts.captionText',
        schema: {
            type: 'string',
            description: `A snippet extracted from the full text of the caption. Can use the following syntax: 
- \`q=spiders\``
        },
        //zqltype: 'expression',
        defaultOp: 'match',
        defaultCol: false
    }
]