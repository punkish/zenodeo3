export const inserts = {
    insertTreatmentAuthor: (db) => db.prepare(
        `INSERT INTO treatmentAuthors (
            treatmentAuthorId,
            treatments_id,
            treatmentAuthor
        )
        VALUES ( 
            @treatmentAuthorId,
            @treatments_id,
            @treatmentAuthor
        )
        ON CONFLICT (treatmentAuthorId)
        DO UPDATE SET
            treatments_id=excluded.treatments_id,
            treatmentAuthor=excluded.treatmentAuthor`
    )
}