function getCounts() {
    this.logger.info(`getting counts`);
    
    const tableOfCounts = this.db.prepare(`
        SELECT schema, name  
        FROM pragma_table_list 
        WHERE type = 'table' 
            AND NOT name glob 'sqlite_*'
    `).all();

    tableOfCounts.forEach(table => {
        const t = `${table.schema}.${table.name}`;
        const sql = `SELECT Count(*) AS count FROM ${t}`;
        table.count = this.db.prepare(sql).get().count;
    });
    
    
    const total = tableOfCounts.map(({ name, count }) => count)
        .reduce((acc, init) => acc + init);
    tableOfCounts.push({ name: '='.repeat(34), count: '='.repeat(5) });
    tableOfCounts.push({ name: 'total', count: total });
    return tableOfCounts;
}

function getArchiveUpdates() {
    this.logger.info(`getting archive updates`);
    const typesOfArchives = { 
        'full': 0,
        'monthly': 0,
        'weekly': 0,
        'daily': 0
    };
    
    // https://stackoverflow.com/a/9763769/183692
    const msToTime = (s) => {
    
        // Pad to 2 or 3 digits, default is 2
        function pad(n, z) {
            z = z || 2;
            return ('00' + n).slice(-z);
        }
    
        const ms = s % 1000;
        s = (s - ms) / 1000;

        const ss = s % 60;
        s = (s - ss) / 60;

        const mm = s % 60;
        const hh = (s - mm) / 60;
        
        return `${pad(hh)}h ${pad(mm)}m ${pad(ss)}s ${pad(ms, 3)}ms`;
    }

    const stm = `
SELECT 
    *, 
    etlEnded - etlStarted AS duration
FROM archive.archivesView
WHERE id IN (
    SELECT max(id) 
    FROM archive.archives 
    GROUP BY typeOfArchive
)
`;
    const lastUpdate = this.db.prepare(stm).all();
    return lastUpdate
}

function selCountOfTreatments() {
    this.logger.info('getting count of treatments already in the db');
    return this.db.prepare(`
        SELECT Count(*) AS num 
        FROM treatments
    `).get().num
}

function checkTreatmentExists(treatmentId) {
    this.logger.debug('getting json of existing treatment');
    return this.db.prepare(`
        SELECT json 
        FROM archive.treatments
        WHERE treatmentId = @treatmentId
    `).get({ treatmentId });
}

function storeTreatmentJSON({ treatments_id, xml, json }) {
    this.logger.debug('storing treatment json in archive');
    return this.db.prepare(`
        INSERT INTO archive.treatments (id, xml, json)
        VALUES (@treatments_id, @xml, @json)
    `).run({ treatments_id, xml, json });
}

function createInsertTreatments() {
    const getTreatmentId = this.db.prepare(`
        SELECT id FROM treatments WHERE treatmentId = ?
    `);

    const insertTreatment = this.db.prepare(`
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
    fulltext,
    xml,
    json
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
    @fulltext,
    @xml,
    @json
)
    `);

    const insertMaterialCitation = this.db.prepare(`
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

    const insertCollectionCode = this.db.prepare(`
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

    const insertMatSciCollCodeLink = this.db.prepare(`
INSERT OR IGNORE INTO materialCitations_collectionCodes (
    materialCitations_id, collectionCodes_id
)
SELECT m.id, c.id
FROM materialCitations m, collectionCodes c
WHERE 
    m.materialCitationId = @materialCitationId
    AND c.collectionCode = @collectionCode
   `);

    const insertBibRefCitation = this.db.prepare(`
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

    const insertFigureCitation = this.db.prepare(`
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

    const insertTreatmentCitation = this.db.prepare(`
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

    const insertTreatmentAuthor = this.db.prepare(`
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

    const insertArchives = this.db.prepare(`
INSERT INTO archive.archivesView (
    typeOfArchive, 
    dateOfArchive, 
    sizeOfArchive,
    unzipStarted, 
    unzipEnded, 
    numOfFiles,
    downloadStarted, 
    downloadEnded,
    etlStarted, 
    etlEnded, 
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
    @typeOfArchive, 
    @dateOfArchive, 
    @sizeOfArchive,
    @unzipStarted, 
    @unzipEnded, 
    @numOfFiles,
    @downloadStarted, 
    @downloadEnded,
    @etlStarted, 
    @etlEnded, 
    @treatments,
    @treatmentCitations, 
    @materialCitations, 
    @figureCitations,
    @bibRefCitations, 
    @treatmentAuthors, 
    @collectionCodes,
    @journals
)
    `);

    // Create and return a transaction function
    const insertTreatments = this.db.transaction((treatments, stats) => {

        for (const treatment of treatments) {
            
            // Check if the treatment we are about to add already exists
            // in the database
            const res = getTreatmentId.get(treatment.treatmentId);
            const treatments_id = res ? res.id : false;
            
            // Proceed only if the treatment does not already exists in the db
            if (!treatments_id) {
                
                //const xml = treatment.xml;
                const json = JSON.parse(JSON.stringify(treatment));
                delete json.xml;
                treatment.json = JSON.stringify(json);

                insertTreatment.run(treatment);
                const res = getTreatmentId.get(treatment.treatmentId);
                const treatments_id = res ? res.id : false;

                // Insert materialCitations
                if (treatment.materialCitations.length) {
                    for (const materialCitation of treatment.materialCitations) {
                        materialCitation.treatments_id = treatments_id;
                        insertMaterialCitation.run(materialCitation);

                        // Insert collectionCodes
                        for (const collectionCode of materialCitation.collectionCodes) {
                            insertCollectionCode.run(collectionCode);
                            insertMatSciCollCodeLink.run({
                                materialCitationId: materialCitation.materialCitationId,
                                collectionCode: collectionCode.collectionCode
                            })
                        }
                    }
                }

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

        insertArchives.run(stats);

    });

    return insertTreatments
}

async function update (typesOfArchives, firstRun = false) {
    
    // we grab the first in the list of archives one of 'yearly', 
    // 'monthly', 'weekly', or 'daily'
    const typeOfArchive = typesOfArchives.shift();
    this.stats.archive.typeOfArchive = typeOfArchive;

    if (!firstRun) {
        if (typeOfArchive === 'yearly') {
            firstRun = true;
        }
    }

    // if needed, download archive from remote server
    await this.download(stats);

    if (!this.stats.archive.dateOfArchive) {

        // if nothing was downloaded, we move on to the next archive
        if (typesOfArchives.length) {
            return await this.update(typesOfArchives);
        }
        else {
            this.logger.info('no more archives on the server');
            return;
        }
        
    }
    
    if (firstRun && typeOfArchive === 'yearly') {
        this.dropIndexes();
    }
    
    // unzip archive, if needed, and read the files into an array
    const files = this.unzip(stats);
    this.etl(files, stats);
    this.insertStats(stats);

    // clean up old archive
    this.cleanOldArchive(stats);

    if (typesOfArchives.length) {
        this.logger.info(`next up, the "${typesOfArchives[0].toUpperCase()}" archive`);
        truebugStats.push(stats);
        return await this.update(typesOfArchives, truebugStats, firstRun);
    }
    else {
        this.logger.info('all archives processed');
    }

    if (firstRun) {
        this.buildIndexes();
        this.analyzeDb();
    }

    // const utilOpts = { showHidden: false, depth: null, color: true };
    // console.log(util.inspect(truebugStats, utilOpts));
    this.postflight.printit(truebugStats);
}

export { 
    getCounts, 
    getArchiveUpdates, 
    selCountOfTreatments, 
    checkTreatmentExists, 
    storeTreatmentJSON,
    createInsertTreatments,
    update
}