const db = {
    name: 'figureCitations',
    alias: 'fc'
}

db.tables = [
    {
        name: 'figureCitations',
        create: `CREATE TABLE IF NOT EXISTS ${db.alias}.figureCitations ( 
            id INTEGER PRIMARY KEY,
            figureNum INTEGER DEFAULT 0,
            figureCitationId TEXT NOT NULL,
            treatmentId TEXT NOT NULL,
            captionText TEXT,
            httpUri TEXT,
            thumbnailUri TEXT,
            deleted INTEGER DEFAULT 0,
            created INTEGER DEFAULT (strftime('%s','now')),
            updated INTEGER,
            UNIQUE (figureCitationId, figureNum)
        )`,
        insert: `INSERT INTO ${db.alias}.figureCitations (
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
            updated=strftime('%s','now')`
    },
    {
        name: 'vfigurecitations',
        type: 'virtual',
        create: `CREATE VIRTUAL TABLE IF NOT EXISTS ${db.alias}.vfigurecitations USING FTS5(
            figureCitationId, 
            figureNum,
            treatmentId,
            captionText
        )`,
        insert: {
            row: {
                select: `SELECT Count(*) AS c FROM ${db.alias}.vfigurecitations WHERE figureCitationId = @figureCitationId AND figureNum = @figureNum`,
                update: `UPDATE ${db.alias}.vfigurecitations SET captionText = @captionText WHERE figureCitationId = @figureCitationId AND figureNum = @figureNum`,
                insert: `INSERT INTO ${db.alias}.vfigurecitations (
                    figureCitationId, 
                    figureNum,
                    treatmentId,
                    captionText
                )
                VALUES (
                    @figureCitationId, 
                    @figureNum,
                    @treatmentId,
                    @captionText
                )`
            },
            bulk: `INSERT INTO ${db.alias}.vfigurecitations 
                SELECT figureCitationId, figureNum, treatmentId, captionText 
                FROM ${db.alias}.figureCitations 
                WHERE deleted = 0`
        }
    }
]

db.indexes = [
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_figureCitations_treatmentId                            ON figureCitations (deleted, treatmentId)`,
    `CREATE INDEX IF NOT EXISTS ${db.alias}.ix_figureCitations_figureCitationId_treatmentId_figureNum ON figureCitations (deleted, figureCitationId, treatmentId, figureNum)`        
]

module.exports = db