export const inserts = {
    insertEtlStats: (db) => db.prepare(
        `INSERT INTO etlstats (
            started, 
            ended, 
            process,
            typeOfArchive,
            timeOfArchive,
            sizeOfArchive,
            numOfFiles,
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
            @started, 
            @ended, 
            @process,
            @typeOfArchive,
            @timeOfArchive,
            @sizeOfArchive,
            @numOfFiles,
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