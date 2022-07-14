const tables = [
    {
        name: 'figureCitations',
        type: 'normal',
        create: `CREATE TABLE IF NOT EXISTS figureCitations ( 
    id INTEGER PRIMARY KEY,
    figureNum INTEGER DEFAULT 0,
    figureCitationId TEXT NOT NULL,
    treatmentId TEXT NOT NULL,
    captionText TEXT,
    httpUri TEXT,
    thumbnailUri TEXT,
    deleted INTEGER DEFAULT 0,
    created INTEGER DEFAULT (strftime('%s','now') * 1000),
    updated INTEGER,
    UNIQUE (figureCitationId, figureNum)
)`,
        insert: `INSERT INTO figureCitations (
    figureNum,
    figureCitationId,
    treatmentId,
    captionText,
    httpUri,
    --thumbnailUri,
    deleted
)
VALUES (
    @figureNum,
    @figureCitationId,
    @treatmentId,
    @captionText,
    @httpUri,
    --@thumbnailUri,
    @deleted
)
ON CONFLICT (figureNum, figureCitationId)
DO UPDATE SET
    figureNum=excluded.figureNum,
    figureCitationId=excluded.figureCitationId,
    treatmentId=excluded.treatmentId,
    captionText=excluded.captionText,
    httpUri=excluded.httpUri,
    --thumbnailUri=excluded.thumbnailUri,
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
WHERE rowid > @maxrowid AND deleted = 0`,
        preparedinsert: '',
        maxrowid: 0
    },
]

const indexes = [
    `CREATE INDEX IF NOT EXISTS ix_figureCitations_treatmentId                            ON figureCitations (deleted, treatmentId)`,
    `CREATE INDEX IF NOT EXISTS ix_figureCitations_figureCitationId_treatmentId_figureNum ON figureCitations (deleted, figureCitationId, treatmentId, figureNum)`,
    `CREATE INDEX IF NOT EXISTS ix_figureCitations_httpUri                                ON figureCitations (deleted, httpUri)`
]

export { tables, indexes }