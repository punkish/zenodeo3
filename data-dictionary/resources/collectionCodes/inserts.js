export const inserts = {
    selectCollectionCodes_id: (db) => db.prepare(`
SELECT id AS collectionCodes_id 
FROM collectionCodes 
WHERE collectionCode = ?
    `),

    insertCollectionCode: (db) => db.prepare(`
INSERT INTO collectionCodes (
    collectionCode,
    country,
    name,
    httpUri,
    lsid,
    type
)
VALUES (
    @collectionCode,
    @country,
    @name,
    @httpUri,
    @lsid,
    @type
)
ON CONFLICT (collectionCode) 
DO UPDATE SET
    country=excluded.country,
    name=excluded.name,
    httpUri=excluded.httpUri,
    lsid=excluded.lsid,
    type=excluded.type
    `)
}