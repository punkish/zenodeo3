export const inserts = {
    insertFigureCitation: (db) => db.prepare(`
INSERT INTO figureCitations (
    figureCitationId,
    figureNum,
    treatments_id
)
VALUES (
    @figureCitationId,
    @figureNum,
    @treatments_id
)
ON CONFLICT (figureCitationId, figureNum)
DO UPDATE SET
    treatments_id=excluded.treatments_id
    `)
}