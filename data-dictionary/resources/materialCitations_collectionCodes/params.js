export const params = [
    {
        name: 'materialCitations_id',
        sql: {
            desc: 'The ID of the related materialCitation (FK)',
            type: 'INTEGER NOT NULL REFERENCES materialCitations(id)'
        }
    },
    {
        name: 'collectionCodes_id',
        sql: {
            desc: 'The ID of the related collectionCode (FK)',
            type: 'INTEGER NOT NULL REFERENCES collectionCodes(id)'
        }
    },
    {
        name:'_pk',
        sql: {
            desc: 'primary key declaration',
            type: 'PRIMARY KEY ("materialCitations_id", "collectionCodes_id")'
        }
    }
]