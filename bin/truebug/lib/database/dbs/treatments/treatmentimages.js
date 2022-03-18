const tables = [
    {
        name: 'treatmentImages',
        type: 'derived',
        create: `CREATE TABLE IF NOT EXISTS images ( 
    id INTEGER PRIMARY KEY,
    httpUri TEXT UNIQUE, 
    captionText TEXT, 
    treatmentId TEXT
)`,
        // Select first row in each group using group by in sqlite
        // https://stackoverflow.com/a/35490165/183692
        insert: `INSERT INTO treatmentImages (httpUri, captionText, treatmentId) 
    SELECT 
        httpUri, 
        captionText, 
        treatmentId 
    FROM 
        figureCitations 
    WHERE 
        rowid > @maxrowid  
        AND httpUri != ''  
        AND httpUri NOT LIKE 'http://dx.doi.org%'  
        AND captionText != '' 
    GROUP BY httpUri 
    HAVING rowid = Min(rowid) 
    ORDER BY rowid`,
        preparedinsert: '',
        maxrowid: 0
    }
]

const indexes = [
    `CREATE INDEX IF NOT EXISTS ix_treatmentImages_treatmentId ON treatmentImages (treatmentId)`
]

module.exports = { tables, indexes }