export const inserts = {
    insertMaterialCitations_collectionCodes: (db) => db.prepare(
        `INSERT INTO materialCitations_collectionCodes (
            materialCitations_id,
            collectionCodes_id
        )
        VALUES (
            @materialCitations_id,
            @collectionCodes_id
        )
        ON CONFLICT (materialCitations_id, collectionCodes_id)
        DO NOTHING`
    )
};