'use strict'

const chalk = require('chalk')
const Database = require('better-sqlite3')
const config = require('config')
const DB = {
    treatments: new Database(config.get('data.treatments')),
    etlStats: new Database(config.get('data.etlStats')),
    queryStats: new Database(config.get('data.queryStats'))
}

const buildIndexes = function(opts) {
    const indexes = {
        ix_treatmentCitations_treatmentCitation  : 'CREATE INDEX IF NOT EXISTS ix_treatmentCitations_treatmentCitation   ON treatmentCitations (deleted, Lower(treatmentCitation)) WHERE deleted = 0',
        ix_treatmentCitations_refString          : 'CREATE INDEX IF NOT EXISTS ix_treatmentCitations_refString           ON treatmentCitations (deleted, Lower(refString)) WHERE deleted = 0',
        ix_bibRefCitations_year                  : 'CREATE INDEX IF NOT EXISTS ix_bibRefCitations_year                   ON bibRefCitations    (deleted, year) WHERE deleted = 0',
        ix_treatments_treatmentId                : 'CREATE INDEX IF NOT EXISTS ix_treatments_treatmentId                 ON treatments         (deleted, treatmentId)',
        ix_treatments_treatmentTitle             : 'CREATE INDEX IF NOT EXISTS ix_treatments_treatmentTitle              ON treatments         (deleted, treatmentTitle COLLATE NOCASE)',
        ix_treatments_articleTitle               : 'CREATE INDEX IF NOT EXISTS ix_treatments_articleTitle                ON treatments         (deleted, articleTitle COLLATE NOCASE)',
        ix_treatments_publicationDate            : 'CREATE INDEX IF NOT EXISTS ix_treatments_publicationDate             ON treatments         (deleted, publicationDate)',
        ix_treatments_journalTitle               : 'CREATE INDEX IF NOT EXISTS ix_treatments_journalTitle                ON treatments         (deleted, journalTitle COLLATE NOCASE)',
        ix_treatments_journalYear                : 'CREATE INDEX IF NOT EXISTS ix_treatments_journalYear                 ON treatments         (deleted, journalYear)',
        ix_treatments_authorityName              : 'CREATE INDEX IF NOT EXISTS ix_treatments_authorityName               ON treatments         (deleted, authorityName COLLATE NOCASE)',
        ix_treatments_taxonomicNameLabel         : 'CREATE INDEX IF NOT EXISTS ix_treatments_taxonomicNameLabel          ON treatments         (deleted, taxonomicNameLabel COLLATE NOCASE)',
        ix_treatments_kingdom                    : 'CREATE INDEX IF NOT EXISTS ix_treatments_kingdom                     ON treatments         (deleted, kingdom COLLATE NOCASE)',
        ix_treatments_phylum                     : 'CREATE INDEX IF NOT EXISTS ix_treatments_phylum                      ON treatments         (deleted, phylum COLLATE NOCASE)',
        ix_treatments_order                      : 'CREATE INDEX IF NOT EXISTS ix_treatments_order                       ON treatments         (deleted, "order" COLLATE NOCASE)',
        ix_treatments_family                     : 'CREATE INDEX IF NOT EXISTS ix_treatments_family                      ON treatments         (deleted, family COLLATE NOCASE)',
        ix_treatments_genus                      : 'CREATE INDEX IF NOT EXISTS ix_treatments_genus                       ON treatments         (deleted, genus COLLATE NOCASE)',
        ix_treatments_species                    : 'CREATE INDEX IF NOT EXISTS ix_treatments_species                     ON treatments         (deleted, species COLLATE NOCASE)',
        ix_treatments_status                     : 'CREATE INDEX IF NOT EXISTS ix_treatments_status                      ON treatments         (deleted, status COLLATE NOCASE)',
        ix_treatments_rank                       : 'CREATE INDEX IF NOT EXISTS ix_treatments_rank                        ON treatments         (deleted, rank COLLATE NOCASE)',
        ix_treatments_k_phylum                   : 'CREATE INDEX IF NOT EXISTS ix_treatments_k_phylum                    ON treatments         (deleted, kingdom, phylum)',
        ix_treatments_k_p_order                  : 'CREATE INDEX IF NOT EXISTS ix_treatments_k_p_order                   ON treatments         (deleted, kingdom, phylum, "order")',
        ix_treatments_k_p_o_family               : 'CREATE INDEX IF NOT EXISTS ix_treatments_k_p_o_family                ON treatments         (deleted, kingdom, phylum, "order", family)',
        ix_treatments_k_p_o_f_genus              : 'CREATE INDEX IF NOT EXISTS ix_treatments_k_p_o_f_genus               ON treatments         (deleted, kingdom, phylum, "order", family, genus)',
        ix_treatments_k_p_o_f_g_species          : 'CREATE INDEX IF NOT EXISTS ix_treatments_k_p_o_f_g_species           ON treatments         (deleted, kingdom, phylum, "order", family, genus, species)',
        ix_treatments_facets                     : 'CREATE INDEX IF NOT EXISTS ix_treatments_facets                      ON treatments         (deleted, treatmentId, journalTitle, journalYear, kingdom, phylum, "order", family, genus, species, status, rank)',
        ix_treatments_deleted                    : 'CREATE INDEX IF NOT EXISTS ix_treatments_deleted                     ON treatments         (deleted)',
        ix_treatmentAuthors_treatmentAuthorId    : 'CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentAuthorId     ON treatmentAuthors   (deleted, treatmentAuthorId)',
        ix_treatmentAuthors_treatmentId          : 'CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentId           ON treatmentAuthors   (deleted, treatmentId)',
        ix_treatmentAuthors_treatmentAuthor      : 'CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_treatmentAuthor       ON treatmentAuthors   (deleted, treatmentAuthor COLLATE NOCASE)',
        ix_treatmentAuthors_deleted              : 'CREATE INDEX IF NOT EXISTS ix_treatmentAuthors_deleted               ON treatmentAuthors   (deleted)',
        ix_materialsCitations_materialsCitationId: 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_materialsCitationId ON materialsCitations (deleted, materialsCitationId)',
        ix_materialsCitations_treatmentId        : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_treatmentId         ON materialsCitations (deleted, treatmentId)',
        ix_materialsCitations_collectingDate     : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectingDate      ON materialsCitations (deleted, collectingDate COLLATE NOCASE)',
        ix_materialsCitations_collectionCode     : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectionCode      ON materialsCitations (deleted, collectionCode COLLATE NOCASE)',
        ix_materialsCitations_collectorName      : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectorName       ON materialsCitations (deleted, collectorName COLLATE NOCASE)',
        ix_materialsCitations_country            : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_country             ON materialsCitations (deleted, country COLLATE NOCASE)',
        ix_materialsCitations_collectingRegion   : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectingRegion    ON materialsCitations (deleted, collectingRegion COLLATE NOCASE)',
        ix_materialsCitations_municipality       : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_municipality        ON materialsCitations (deleted, municipality COLLATE NOCASE)',
        ix_materialsCitations_county             : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_county              ON materialsCitations (deleted, county COLLATE NOCASE)',
        ix_materialsCitations_stateProvince      : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_stateProvince       ON materialsCitations (deleted, stateProvince COLLATE NOCASE)',
        ix_materialsCitations_location           : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_location            ON materialsCitations (deleted, location COLLATE NOCASE)',
        ix_materialsCitations_locationDeviation  : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_locationDeviation   ON materialsCitations (deleted, locationDeviation COLLATE NOCASE)',
        ix_materialsCitations_specimenCountFemale: 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCountFemale ON materialsCitations (deleted, specimenCountFemale COLLATE NOCASE)',
        ix_materialsCitations_specimenCountMale  : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCountMale   ON materialsCitations (deleted, specimenCountMale COLLATE NOCASE)',
        ix_materialsCitations_specimenCount      : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCount       ON materialsCitations (deleted, specimenCount COLLATE NOCASE)',
        ix_materialsCitations_specimenCode       : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_specimenCode        ON materialsCitations (deleted, specimenCode COLLATE NOCASE)',
        ix_materialsCitations_typeStatus         : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_typeStatus          ON materialsCitations (deleted, typeStatus COLLATE NOCASE)',
        ix_materialsCitations_determinerName     : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_determinerName      ON materialsCitations (deleted, determinerName COLLATE NOCASE)',
        ix_materialsCitations_collectedFrom      : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectedFrom       ON materialsCitations (deleted, collectedFrom COLLATE NOCASE)',
        ix_materialsCitations_collectingMethod   : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_collectingMethod    ON materialsCitations (deleted, collectingMethod COLLATE NOCASE)',
        ix_materialsCitations_latitude           : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_latitude            ON materialsCitations (deleted, latitude)',
        ix_materialsCitations_longitude          : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_longitude           ON materialsCitations (deleted, longitude)',
        ix_materialsCitations_elevation          : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_elevation           ON materialsCitations (deleted, elevation)',
        ix_materialsCitations_deleted            : 'CREATE INDEX IF NOT EXISTS ix_materialsCitations_deleted             ON materialsCitations (deleted)',
        ix_treatmentCitations_treatmentCitationId: 'CREATE INDEX IF NOT EXISTS ix_treatmentCitations_treatmentCitationId ON treatmentCitations (deleted, treatmentCitationId)',
        ix_treatmentCitations_treatmentId        : 'CREATE INDEX IF NOT EXISTS ix_treatmentCitations_treatmentId         ON treatmentCitations (deleted, treatmentId)',
        ix_treatmentCitations_deleted            : 'CREATE INDEX IF NOT EXISTS ix_treatmentCitations_deleted             ON treatmentCitations (deleted)',
        ix_figureCitations_treatmentId           : 'CREATE INDEX IF NOT EXISTS ix_figureCitations_treatmentId            ON figureCitations    (deleted, treatmentId)',
        ix_figureCitations_figureCitationId      : 'CREATE INDEX IF NOT EXISTS ix_figureCitations_figureCitationId       ON figureCitations    (deleted, figureCitationId, treatmentId)',
        ix_bibRefCitations_bibRefCitationId      : 'CREATE INDEX IF NOT EXISTS ix_bibRefCitations_bibRefCitationId       ON bibRefCitations    (deleted, bibRefCitationId)',
        ix_bibRefCitations_treatmentId           : 'CREATE INDEX IF NOT EXISTS ix_bibRefCitations_treatmentId            ON bibRefCitations    (deleted, treatmentId)',
        ix_bibRefCitations_deleted               : 'CREATE INDEX IF NOT EXISTS ix_bibRefCitations_deleted                ON bibRefCitations    (deleted)',
    }

    for (let i in indexes) {
        process.stdout.write(`   - creating index ${chalk.bold(i)} … `)
        if (opts.runtype === 'real') {
            try {
                DB.treatments.prepare(indexes[i]).run()
                console.log(chalk.green('done'))
            }
            catch(error) {
                console.log(`… skipping (already exists)`);
            }
        }
        else {
            console.log(chalk.green('done'))
        }
    }
}

buildIndexes({
    runtype: 'real'
})