export const inserts = {
    insertEtl: (db) => db.prepare(
        `INSERT INTO etl (
            archives_id,
            started, 
            ended, 
            treatments,
            treatmentCitations,
            materialCitations,
            figureCitations,
            bibRefCitations,
            treatmentAuthors,
            collectionCodes,
            journals
        ) 
        VALUES (
            @archives_id,
            @started, 
            @ended, 
            @treatments,
            @treatmentCitations,
            @materialCitations,
            @figureCitations,
            @bibRefCitations,
            @treatmentAuthors,
            @collectionCodes,
            @journals
        )`
    )
}