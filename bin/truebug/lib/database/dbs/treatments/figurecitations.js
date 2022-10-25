const tables = [
    {
        name: 'figureCitations',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS figureCitations ( 
    id INTEGER PRIMARY KEY,
    figureNum INTEGER DEFAULT 0,
    figureCitationId TEXT NOT NULL COLLATE NOCASE,
    treatmentId TEXT NOT NULL COLLATE NOCASE,
    captionText TEXT COLLATE NOCASE,
    httpUri TEXT COLLATE NOCASE,
    deleted INTEGER DEFAULT 0,
    
    -- ms since epoch record created in zenodeo
    created INTEGER DEFAULT (
        strftime('%s','now') * 1000
    ),  

    -- ms since epoch record updated in zenodeo
    updated INTEGER,
    UNIQUE (figureCitationId, figureNum)
)`,
        insert: `INSERT INTO figureCitations (
    figureNum,
    figureCitationId,
    treatmentId,
    captionText,
    httpUri,
    deleted
)
VALUES (
    @figureNum,
    @figureCitationId,
    @treatmentId,
    @captionText,
    @httpUri,
    @deleted
)
ON CONFLICT (figureNum, figureCitationId)
DO UPDATE SET
    figureNum=excluded.figureNum,
    figureCitationId=excluded.figureCitationId,
    treatmentId=excluded.treatmentId,
    captionText=excluded.captionText,
    httpUri=excluded.httpUri,
    deleted=excluded.deleted,
    updated=strftime('%s','now') * 1000`,
        preparedinsert: '',
        data: []
    },
    {
        name: 'vfigurecitations',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISTS vfigurecitations USING FTS5(
    figureCitationId, 
    figureNum,
    treatmentId,
    captionText
)`,
        insert: `INSERT INTO vfigurecitations 
SELECT figureCitationId, figureNum, treatmentId, captionText 
FROM figureCitations 
WHERE rowid > @maxrowid`,
        preparedinsert: '',
        maxrowid: 0
    },
]

const indexes = [
    `CREATE INDEX IF NOT EXISTS ix_figureCitations_treatmentId                            ON figureCitations (treatmentId)`,
    `CREATE INDEX IF NOT EXISTS ix_figureCitations_figureCitationId_treatmentId_figureNum ON figureCitations (figureCitationId, treatmentId, figureNum)`,
    `CREATE INDEX IF NOT EXISTS ix_figureCitations_httpUri                                ON figureCitations (httpUri)`
]

export { tables, indexes }