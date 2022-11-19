import { resources } from '../../../../../../data-dictionary/resources.js';
const alias = resources.filter(r => r.name === 'treatmentImages')[0].alias;

const tables = [
    {
        name: 'treatmentImages',
        type: 'derived',
        create: `CREATE TABLE IF NOT EXISTS treatmentImages ( 
    id INTEGER PRIMARY KEY,
    figureCitationRowid INTEGER,
    httpUri TEXT UNIQUE, 
    captionText TEXT, 
    treatmentId TEXT
)`,
        // Select first row in each group using group by in sqlite
        // https://stackoverflow.com/a/35490165/183692
        insert: `INSERT INTO ${alias}.treatmentImages (
            figureCitationRowid, 
            httpUri, 
            captionText, 
            treatmentId
        )
        SELECT 
            rowid,
            httpUri, 
            captionText, 
            treatmentId 
        FROM 
            fc.figureCitations 
        WHERE 
            rowid > (
                SELECT 
                    Ifnull(Max(figureCitationRowid), 0) 
                    FROM ${alias}.treatmentImages
                )
            AND httpUri != ''  
            AND httpUri NOT LIKE 'http://dx.doi.org%'  
            AND captionText != '' 
            AND httpUri NOT IN (SELECT httpUri FROM ${alias}.treatmentImages)
        GROUP BY httpUri 
        HAVING rowid = Max(rowid) 
        ORDER BY rowid`,
        preparedinsert: '',
        maxrowid: 0
    }
]

const indexes = [
    {
        name: 'ix_treatmentImages_treatmentId',
        create: `CREATE INDEX IF NOT EXISTS ${alias}.ix_treatmentImages_treatmentId ON treatmentImages (treatmentId)`
    }
];

const triggers = [];

export { tables, indexes, triggers }