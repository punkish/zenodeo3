function getTreatmentId(treatmentId, db) {
    const res = db.prepare('SELECT id FROM treatments WHERE treatmentId = ?')
        .get(treatmentId);

    if (res) {
        return res.id;
    }
    else {
        return false;
    }
}

export function createInsertTreatments(db) {
    const insertTreatment = db.prepare(`
INSERT INTO treatmentsView (
    treatmentId,
    treatmentTitle, 
    treatmentVersion,
    treatmentDOIorig,
    treatmentLSID,
    zenodoDep,
    zoobankId,
    articleId,
    articleTitle,
    articleAuthor,
    articleDOIorig,
    publicationDate,
    journalTitle,
    journalYear,
    journalVolume,
    journalIssue,
    pages,
    authorityName,
    authorityYear,
    kingdom,
    phylum,
    class,
    "order",
    genus,
    family,
    species,
    rank,
    status,
    taxonomicNameLabel,
    updateTime,
    checkinTime,
    --updated,
    timeToParseXML,
    fulltext
) 
VALUES (
    @treatmentId,
    @treatmentTitle, 
    @treatmentVersion,
    @treatmentDOIorig,
    @treatmentLSID,
    @zenodoDep,
    @zoobankId,
    @articleId,
    @articleTitle,
    @articleAuthor,
    @articleDOIorig,
    @publicationDate,
    @journalTitle,
    @journalYear,
    @journalVolume,
    @journalIssue,
    @pages,
    @authorityName,
    @authorityYear,
    @kingdom,
    @phylum,
    @class,
    @order,
    @genus,
    @family,
    @species,
    @rank,
    @status,
    @taxonomicNameLabel,
    @updateTime,
    @checkinTime,
    --@updated,
    @timeToParseXML,
    @fulltext
)
    `);

    const insertMaterialCitation = db.prepare(`
INSERT INTO materialCitations (
    materialCitationId,
    treatments_id,
    collectingDate,
    collectionCodeCSV,
    collectorName,
    country,
    collectingRegion,
    municipality,
    county,
    stateProvince,
    location,
    locationDeviation,
    specimenCountFemale,
    specimenCountMale,
    specimenCount,
    specimenCode,
    typeStatus,
    determinerName,
    collectedFrom,
    collectingMethod,
    latitude, 
    longitude,
    elevation,
    httpUri,
    deleted,
    --isOnLand, 
    --ecoregions_id, 
    --biomes_id, 
    --realms_id,
    fulltext
) 
VALUES (
    @materialCitationId,
    @treatments_id,
    @collectingDate,
    @collectionCodeCSV,
    @collectorName,
    @country,
    @collectingRegion,
    @municipality,
    @county,
    @stateProvince,
    @location,
    @locationDeviation,
    @specimenCountFemale,
    @specimenCountMale,
    @specimenCount,
    @specimenCode,
    @typeStatus,
    @determinerName,
    @collectedFrom,
    @collectingMethod,
    @latitude, 
    @longitude,
    @elevation,
    @httpUri,
    @deleted,
    --@isOnLand, 
    --@ecoregions_id, 
    --@biomes_id, 
    --@realms_id,
    @fulltext
)
    `);

    const insertCollectionCode = db.prepare(`
INSERT OR IGNORE INTO collectionCodes (
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
    `);

    const insertMcCcLink = db.prepare(`
INSERT OR IGNORE INTO materialCitations_collectionCodes (
    materialCitations_id, collectionCodes_id
)
SELECT m.id, c.id
FROM materialCitations m, collectionCodes c
WHERE 
    m.materialCitationId = @materialCitationId
    AND c.collectionCode = @collectionCode
   `);

    const insertBibRefCitation = db.prepare(`
INSERT INTO bibRefCitations (
    bibRefCitationId,
    treatments_id,
    DOI,
    author,
    journalOrPublisher,
    title,
    type,
    year
)
VALUES (
    @bibRefCitationId,
    @treatments_id,
    @DOI,
    @author,
    @journalOrPublisher,
    @title,
    @type,
    @year
)
    `);

    const insertFigureCitation = db.prepare(`
INSERT INTO figureCitations (
    figureCitationId,
    treatments_id,
    httpUri,
    figureDoiOriginal,
    figureNum,
    updateVersion,
    captionText
)
VALUES (
    @figureCitationId,
    @treatments_id,
    @httpUri,
    @figureDoiOriginal,
    @figureNum,
    @updateVersion,
    @captionText
)
    `);

    const insertTreatmentCitation = db.prepare(`
INSERT INTO treatmentCitationsView (
    treatmentCitationId,
    treatments_id,
    bibRefCitationId,
    treatmentCitation,
    refString
)
VALUES (
    @treatmentCitationId,
    @treatments_id,
    @bibRefCitationId,
    @treatmentCitation,
    @refString
)
    `);

    const insertTreatmentAuthor = db.prepare(`
INSERT INTO treatmentAuthors (
    treatmentAuthorId,
    treatments_id,
    treatmentAuthor,
    email
)
VALUES (
    @treatmentAuthorId,
    @treatments_id,
    @treatmentAuthor,
    @email
)
    `);

    const insertTreatments = db.transaction((treatments) => {

        for (const treatment of treatments) {
            
            // Get internal treatment row ID
            const treatments_id = getTreatmentId(treatment.treatmentId, db);

            if (!treatments_id) {
                insertTreatment.run(treatment);
                const treatments_id = getTreatmentId(treatment.treatmentId, db);

                // Insert materialCitations
                if (treatment.materialCitations.length) {
                    for (const materialCitation of treatment.materialCitations) {
                        materialCitation.treatments_id = treatments_id;
                        insertMaterialCitation.run(materialCitation);

                        // Insert collectionCodes
                        for (const collectionCode of materialCitation.collectionCodes) {
                            insertCollectionCode.run(collectionCode);
                            insertMcCcLink.run({
                                materialCitationId: materialCitation.materialCitationId,
                                collectionCode: collectionCode.collectionCode
                            })
                        }
                    }
                }
                

                // Insert images
                // for (const image of treatment.images) {
                //     image.treatments_id = treatments_id;
                //     insertImage.run(image);
                // }

                // Insert figureCitations
                if (treatment.figureCitations.length) {
                    for (const figureCitation of treatment.figureCitations) {
                        figureCitation.treatments_id = treatments_id;
                        insertFigureCitation.run(figureCitation);
                    }
                }
                
                // Insert bibRefCitations
                if (treatment.bibRefCitations.length) {
                    for (const bibRefCitation of treatment.bibRefCitations) {
                        bibRefCitation.treatments_id = treatments_id;
                        insertBibRefCitation.run(bibRefCitation);
                    }
                }

                // Insert treatmentCitations
                if (treatment.treatmentCitations.length) {
                    for (const treatmentCitation of treatment.treatmentCitations) {
                        treatmentCitation.treatments_id = treatments_id;
                        insertTreatmentCitation.run(treatmentCitation);
                    }
                }

                // Insert treatmentAuthors
                if (treatment.treatmentAuthors.length) {
                    for (const treatmentAuthor of treatment.treatmentAuthors) {
                        treatmentAuthor.treatments_id = treatments_id;
                        insertTreatmentAuthor.run(treatmentAuthor);
                    }
                }
            }

            
            
        }

    });

    
    return insertTreatments
}