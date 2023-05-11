export const params = [
    {
        name: 'treatments_id',
        sql: {
            desc: 'The ID of the related treatment (FK)',
            type: 'TEXT NOT NULL REFERENCES treatments(id)'
        }
    },
    {
        name: 'images_id',
        sql: {
            desc: 'The ID of the related image (FK)',
            type: 'TEXT NOT NULL REFERENCES images(id)'
        }
    },
    {
        name:'_pk',
        sql: {
            desc: 'primary key declaration',
            type: 'PRIMARY KEY ("treatments_id", "images_id")'
        }
    }
];