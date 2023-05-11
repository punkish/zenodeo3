export const params = [
    {
        name: 'images_id',
        sql: {
            desc: 'The ID of the related image (FK)',
            type: 'INTEGER NOT NULL REFERENCES images(id)'
        }
    },
    {
        name: 'figureCitations_id',
        sql: {
            desc: 'The ID of the related figureCitation (FK)',
            type: 'INTEGER NOT NULL REFERENCES figureCitations(id)'
        }
    },
    {
        name:'_pk',
        sql: {
            desc: 'primary key declaration',
            type: 'PRIMARY KEY ("images_id", "figureCitations_id")'
        }
    }
];