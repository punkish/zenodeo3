export const inserts = {
    insertTreatmentCitation: (db) => db.prepare(
        `INSERT INTO treatmentCitations (
            treatmentCitationId,
            treatments_id,
            bibRefCitations_id,
            treatmentCitation,
            refString
        )
        VALUES ( 
            @treatmentCitationId,
            @treatments_id,
            @bibRefCitations_id,
            @treatmentCitation,
            @refString
        )
        ON CONFLICT (treatmentCitationId)
        DO UPDATE SET
            treatments_id=excluded.treatments_id,
            bibRefCitations_id=excluded.bibRefCitations_id,
            treatmentCitation=excluded.treatmentCitation,
            refString=excluded.refString`
    )
}