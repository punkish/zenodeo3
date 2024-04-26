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
        name: 'eco_name',
        schema: { 
            type: 'string', 
            description: ''
        },
        sql: {
            type: 'TEXT',
            desc: 'name of the ecoregions'
        },
        defaultOp: 'starts_with'
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
        name: 'geometry',
        schema: { 
            type: 'string', 
            description: ''
        },
        sql: {
            type: 'TEXT',
            desc: 'GeoJSON of the ecoregion'
        },
        defaultCol: false,
        notqueryable: true
    }
]