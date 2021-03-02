'use strict'

const chalk = require('chalk')
const Database = require('better-sqlite3')
const config = require('config')
const db = new Database(config.get('data.treatmentsTmp'))

const preparedInsertStatements = (function() {

    const stmts = {}

    const updateTime = Math.floor(new Date().getTime() / 1000)
    const rawInsertStatements = {
        treatments: `INSERT INTO treatments (
                treatmentId,
                treatmentTitle,
                doi,
                zenodoDep,
                zoobank,
                articleTitle,
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
                "order",
                family,
                genus,
                species,
                status,
                taxonomicNameLabel,
                rank,
                q,
                deleted
            )
            VALUES ( 
                @treatmentId,
                @treatmentTitle,
                @doi,
                @zenodoDep,
                @zoobank,
                @articleTitle,
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
                @order,
                @family,
                @genus,
                @species,
                @status,
                @taxonomicNameLabel,
                @rank,
                @q,
                @deleted
            )
            ON CONFLICT (treatmentId)
            DO UPDATE SET
                treatmentTitle=excluded.treatmentTitle,
                doi=excluded.doi,
                zenodoDep=excluded.zenodoDep,
                zoobank=excluded.zoobank,
                articleTitle=excluded.articleTitle,
                publicationDate=excluded.publicationDate,
                journalTitle=excluded.journalTitle,
                journalYear=excluded.journalYear,
                journalVolume=excluded.journalVolume,
                journalIssue=excluded.journalIssue,
                pages=excluded.pages,
                authorityName=excluded.authorityName,
                authorityYear=excluded.authorityYear,
                kingdom=excluded.kingdom,
                phylum=excluded.phylum,
                "order"=excluded."order",
                family=excluded.family,
                genus=excluded.genus,
                species=excluded.species,
                status=excluded.status,
                taxonomicNameLabel=excluded.taxonomicNameLabel,
                rank=excluded.rank,
                q=excluded.q,
                author=excluded.author,
                deleted=excluded.deleted,
                updated=${updateTime}`,

        treatmentAuthors: `INSERT INTO treatmentAuthors (
                treatmentAuthorId,
                treatmentId,
                treatmentAuthor,
                deleted
            )
            VALUES ( 
                @treatmentAuthorId,
                @treatmentId,
                @treatmentAuthor,
                @deleted
            )
            ON CONFLICT (treatmentAuthorId, treatmentId)
            DO UPDATE SET
                treatmentId=excluded.treatmentId,
                treatmentAuthor=excluded.treatmentAuthor,
                deleted=excluded.deleted,
                updated=${updateTime}`,

        materialsCitations: `INSERT INTO materialsCitations (
                materialsCitationId,
                treatmentId,
                collectingDate,
                collectionCode,
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
                deleted
            )
            VALUES ( 
                @materialsCitationId,
                @treatmentId,
                @collectingDate,
                @collectionCode,
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
                @deleted
            )
            ON CONFLICT (materialsCitationId, treatmentId)
            DO UPDATE SET
                treatmentId=excluded.treatmentId,
                collectingDate=excluded.collectingDate,
                collectionCode=excluded.collectionCode,
                collectorName=excluded.collectorName,
                country=excluded.country,
                collectingRegion=excluded.collectingRegion,
                municipality=excluded.municipality,
                county=excluded.county,
                stateProvince=excluded.stateProvince,
                location=excluded.location,
                locationDeviation=excluded.locationDeviation,
                specimenCountFemale=excluded.specimenCountFemale,
                specimenCountMale=excluded.specimenCountMale,
                specimenCount=excluded.specimenCount,
                specimenCode=excluded.specimenCode,
                typeStatus=excluded.typeStatus,
                determinerName=excluded.determinerName,
                collectedFrom=excluded.collectedFrom,
                collectingMethod=excluded.collectingMethod,
                latitude=excluded.latitude,
                longitude=excluded.longitude,
                elevation=excluded.elevation,
                httpUri=excluded.httpUri,
                deleted=excluded.deleted,
                updated=${updateTime}`,

        treatmentCitations: `INSERT INTO treatmentCitations (
                treatmentCitationId,
                treatmentId,
                treatmentCitation,
                refString,
                deleted
            )
            VALUES ( 
                @treatmentCitationId,
                @treatmentId,
                @treatmentCitation,
                @refString,
                @deleted
            )
            ON CONFLICT (treatmentCitationId, treatmentId)
            DO UPDATE SET
                treatmentId=excluded.treatmentId,
                treatmentCitation=excluded.treatmentCitation,
                refString=excluded.refString,
                deleted=excluded.deleted,
                updated=${updateTime}`,

                //thumbnailUri,
        figureCitations: `INSERT INTO figureCitations (
                figureCitationId,
                treatmentId,
                captionText,
                httpUri,
                
                deleted
            )
            VALUES ( 
                @figureCitationId,
                @treatmentId,
                @captionText,
                @httpUri,
                
                @deleted
            )
            ON CONFLICT (figureCitationId, treatmentId)
            DO UPDATE SET
                treatmentId=excluded.treatmentId,
                captionText=excluded.captionText,
                httpUri=excluded.httpUri,
                
                deleted=excluded.deleted,
                updated=${updateTime}`,

        bibRefCitations: `INSERT INTO bibRefCitations (
                bibRefCitationId,
                treatmentId,
                refString,
                type,
                year,
                deleted
            )
            VALUES ( 
                @bibRefCitationId,
                @treatmentId,
                @refString,
                @type,
                @year,
                @deleted
            )
            ON CONFLICT (bibRefCitationId, treatmentId)
            DO UPDATE SET
                treatmentId=excluded.treatmentId,
                refString=excluded.refString,
                type=excluded.type,
                year=excluded.year,
                deleted=excluded.deleted,
                updated=${updateTime}`,
    
        vtreatments: 'INSERT INTO vtreatments SELECT treatmentId, q FROM treatments WHERE deleted = 0',
        vfigurecitations: 'INSERT INTO vfigurecitations SELECT figureCitationId, captionText FROM figureCitations WHERE deleted = 0',
        vbibrefcitations: 'INSERT INTO vbibrefcitations SELECT bibRefCitationId, refString FROM bibRefCitations WHERE deleted = 0',
        vlocations: "INSERT INTO vlocations(treatmentId, materialsCitationId, _shape) SELECT treatments.treatmentId, materialsCitationId, '[[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || '],[' || longitude || ',' || latitude || ']]' AS _shape FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE latitude != '' AND longitude != ''"
    }

    for (let table in rawInsertStatements) {
        const stmt = rawInsertStatements[ table ]
        stmts[ table ] = db.prepare(stmt)
    }

    return stmts
})()

console.log(preparedInsertStatements)

const insertData = function(data) {

    // const counts = {
    //     treatments: data.length,
    //     treatmentAuthors   : 0, 
    //     materialsCitations : 0, 
    //     treatmentCitations : 0, 
    //     figureCitations    : 0, 
    //     bibRefCitations    : 0
    // }
    // for (let i = 0, j = data.length; i < j; i++) {
    //     if (data[i].treatmentAuthors)   counts.treatmentAuthors   += data[i].treatmentAuthors.length
    //     if (data[i].materialsCitations) counts.materialsCitations += data[i].materialsCitations.length
    //     if (data[i].treatmentCitations) counts.treatmentCitations += data[i].treatmentCitations.length
    //     if (data[i].figureCitations)    counts.figureCitations    += data[i].figureCitations.length
    //     if (data[i].bibRefCitations)    counts.bibRefCitations    += data[i].bibRefCitations.length
    // }

    /***************************************************************************
     * 
     * The data structure submitted to `loadData()` looks as follows
     * 
     * data = [ 
     * 
     *     // treatment 1 and its related data
     *     { 
     *         treatment: { },
     *         treatmentAuthors:    [ {}, {} …  ],
     *         materialCitations:   [ {}, {} …  ],
     *         treatmentCitations:  [ {}, {} …  ],
     *         figureCitations:     [ {}, {} …  ],
     *         bibRefCitations:     [ {}, {} …  ] 
     *     },
     * 
     *     // treatment 2 and its related data
     *     { 
     *         treatment: { },
     *         treatmentAuthors:    [ {}, {} …  ],
     *         materialCitations:   [ {}, {} …  ],
     *         treatmentCitations:  [ {}, {} …  ],
     *         figureCitations:     [ {}, {} …  ],
     *         bibRefCitations:     [ {}, {} …  ] 
     *     } 
     * ]
     *
     * We need to convert this hierarchical array of treatments into 
     * a separate array for each part of the treatment so they can be 
     * inserted into the separate SQL tables. However, we also have 
     * add an extra 'treatmentId' key to all the componoents of a 
     * treatment so they can be linked together in a SQL JOIN query.
     * So the above data structure will be converted to the following
     *
     * d = {
     *     treatments: [ {}, {} … ],
     *     treatmentAuthors: [ {}, {} … ],
     *     materialsCitations: [ {}, {} … ],
     *     treatmentCitations: [ {}, {} … ],
     *     figureCitations: [ {}, {} … ],
     *     bibRefCitations: [ {}, {} … ]
     * }
     * 
     ***************************************************************************/

    const d = {
        treatments: [],
        treatmentAuthors: [],
        materialsCitations: [],
        treatmentCitations: [],
        figureCitations: [],
        bibRefCitations: []
    };

    for (let i = 0, j = data.length; i < j; i++) {
        const t = data[i]

        for (let table in t) {
            if (table === 'treatment') {
                d.treatments.push( t[ table ] );
            }
            else {
                d[table].push( ...t[ table ] );
            }
        }
    }

    for (let table in d) {
        if (d[ table ].length) {

            const insertMany = db.transaction((rows) => {
                for (const row of rows) {  
                    preparedInsertStatements[ table ].run(row)
                }
            })

            insertMany(d[ table ])
        }
    }
}

const loadFTSTreatments = function() {
    preparedInsertStatements.vtreatments.run()
}

const loadFTSFigureCitations = function() {
    preparedInsertStatements.vfigurecitations.run()
}

const loadFTSBibRefCitations = function() {
    preparedInsertStatements.vbibrefcitations.run()
}

module.exports = {
    insertData,
    loadFTSTreatments,
    loadFTSFigureCitations,
    loadFTSBibRefCitations
}