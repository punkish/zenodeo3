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
        insert: `INSERT INTO treatmentImages (
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
    figureCitations 
WHERE 
    rowid > (SELECT Max(figureCitationRowid) FROM treatmentImages)
    AND httpUri != ''  
    AND httpUri NOT LIKE 'http://dx.doi.org%'  
    AND captionText != '' 
    AND httpUri NOT IN (SELECT httpUri FROM treatmentImages)
GROUP BY httpUri 
HAVING rowid = Max(rowid) 
ORDER BY rowid`,
        preparedinsert: '',
        maxrowid: 0
    }
]

const indexes = [
    `CREATE INDEX IF NOT EXISTS ix_treatmentImages_treatmentId ON treatmentImages (treatmentId)`
]

export{ tables, indexes }