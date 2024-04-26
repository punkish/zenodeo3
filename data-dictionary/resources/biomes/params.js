export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the image',
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
        selname: 'biome_synonyms.biome_synonym',
        where: 'biome_synonyms.biome_synonym',
        schema: { 
            type: 'string', 
            description: ''
        },
        sql: {
            type: 'TEXT',
            desc: 'name of the biome'
        },
        joins: [
            'JOIN biome_synonyms ON biomes.id = biome_synonyms.biomes_id'
        ],
        defaultOp: 'starts_with'
    },
    {
        name: 'biome_id',
        selname: 'biomes.id',
        where: 'biomes.id',
        schema: { 
            type: 'integer', 
            description: ''
        },
        // sql: {
        //     type: 'TEXT',
        //     desc: 'name of the biome'
        // },
        // joins: [
        //     'JOIN biome_synonyms ON biomes.id = biome_synonyms.biomes_id'
        // ],
        defaultOp: 'eq'
    }
];