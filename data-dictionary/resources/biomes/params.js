export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        isResourceId: true
    },
    {
        name: 'biome_name',
        schema: { 
            type: 'string', 
            description: ''
        },
        sql: {
            type: 'TEXT',
            desc: 'name of the biome'
        },
        defaultOp: 'starts_with'
    },
    {
        name: 'biome',
        selname: 'biome_synonyms.synonym',
        where: 'biome_synonyms.synonym',
        schema: { 
            type: 'string', 
            description: ''
        },
        sql: {
            type: 'TEXT',
            desc: 'name of the biome'
        },
        defaultOp: 'starts_with'
    }
]