import process from 'node:process';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import Database from 'better-sqlite3';
const db = new Database(config.db['treatments-testing']);
import * as utils from '../utils.js';

const queries1 = {
    "count": {
        "query": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q",
        "runtime": "0s 215.71ms"
    },
    "full": {
        "query": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0",
        "runtime": "0s 92.10ms"
    },
    "stats": {
        "treatments": {
            "query": "SELECT treatments.checkInYear, Count (DISTINCT treatments.treatmentId) AS num FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId WHERE vtreatments MATCH @q GROUP BY 1",
            "runtime": "0s 167.41ms"
        },
        "materialsCitations": {
            "query": "SELECT treatments.checkInYear, Count (DISTINCT materialsCitations.materialsCitationId) AS num FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId JOIN materialsCitations ON materialsCitations.treatmentId = treatments.treatmentId WHERE vtreatments MATCH @q GROUP BY 1",
            "runtime": "0s 98.45ms"
        },
        "figureCitations": {
            "query": "SELECT treatments.checkInYear, Count (DISTINCT figureCitations.figureCitationId) AS num FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId JOIN figureCitations ON figureCitations.treatmentId = treatments.treatmentId WHERE vtreatments MATCH @q GROUP BY 1",
            "runtime": "94s 32.22ms"
        },
        "treatmentCitations": {
            "query": "SELECT treatments.checkInYear, Count (DISTINCT treatmentCitations.treatmentCitationId) AS num FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId JOIN treatmentCitations ON treatmentCitations.treatmentId = treatments.treatmentId WHERE vtreatments MATCH @q GROUP BY 1",
            "runtime": "0s 202.25ms"
        },
        "bibRefCitations": {
            "query": "SELECT treatments.checkInYear, Count (DISTINCT bibRefCitations.bibRefCitationId) AS num FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId JOIN bibRefCitations ON bibRefCitations.treatmentId = treatments.treatmentId WHERE vtreatments MATCH @q GROUP BY 1",
            "runtime": "0s 151.79ms"
        },
        "locations": {
            "query": "SELECT materialsCitations.country, Count(materialsCitations.materialsCitationId) AS num FROM treatments JOIN vtreatments ON treatments.treatmentId = vtreatments.treatmentId JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId  WHERE vtreatments MATCH @q GROUP BY country ORDER BY num DESC",
            "runtime": "0s 80.76ms"
        }
    },
    "runparams": {
        "q": "tetramorium"
    }
}

const queries2 = {
    "count": {
        "query": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments WHERE treatments.authorityName LIKE @authorityName AND treatments.deleted = 0",
        "runtime": "0s 82.65ms"
    },
    "full": {
        "query": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE treatments.authorityName LIKE @authorityName AND treatments.deleted = 0 ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0",
        "runtime": "0s 2.08ms"
    },
    "stats": {
        "treatments": {
            "query": "SELECT checkInYear, Count (DISTINCT treatments.treatmentId) AS num FROM treatments INDEXED BY ix_treatments_authorityName WHERE treatments.authorityName LIKE @authorityName AND treatments.deleted = 0 GROUP BY 1",
            "runtime": "0s 6.71ms"
        },
        "materialsCitations": {
            "query": "SELECT checkInYear, Count (DISTINCT materialsCitations.materialsCitationId) AS num FROM treatments INDEXED BY ix_treatments_authorityName JOIN materialsCitations INDEXED BY ix_materialsCitations_treatmentId ON materialsCitations.treatmentId = treatments.treatmentId WHERE treatments.authorityName LIKE @authorityName AND treatments.deleted = 0 AND materialsCitations.deleted = 0 GROUP BY 1",
            "runtime": "9s 302.16ms"
        },
        "figureCitations": {
            "query": "SELECT checkInYear, Count (DISTINCT figureCitations.figureCitationId) AS num FROM treatments INDEXED BY ix_treatments_authorityName JOIN figureCitations INDEXED BY ix_figureCitations_treatmentId ON figureCitations.treatmentId = treatments.treatmentId WHERE treatments.authorityName LIKE @authorityName AND treatments.deleted = 0 AND figureCitations.deleted = 0 GROUP BY 1",
            "runtime": "19s 50.59ms"
        },
        "treatmentCitations": {
            "query": "SELECT checkInYear, Count (DISTINCT treatmentCitations.treatmentCitationId) AS num FROM treatments INDEXED BY ix_treatments_authorityName JOIN treatmentCitations INDEXED BY ix_treatmentCitations_treatmentId ON treatmentCitations.treatmentId = treatments.treatmentId WHERE treatments.authorityName LIKE @authorityName AND treatments.deleted = 0 AND treatmentCitations.deleted = 0 GROUP BY 1",
            "runtime": "4s 856.71ms"
        },
        "bibRefCitations": {
            "query": "SELECT checkInYear, Count (DISTINCT bibRefCitations.bibRefCitationId) AS num FROM treatments INDEXED BY ix_treatments_authorityName JOIN bibRefCitations INDEXED BY ix_bibRefCitations_treatmentId ON bibRefCitations.treatmentId = treatments.treatmentId WHERE treatments.authorityName LIKE @authorityName AND treatments.deleted = 0 AND bibRefCitations.deleted = 0 GROUP BY 1",
            "runtime": "14s 254.14ms"
        },
        "locations": {
            "query": "SELECT materialsCitations.country, Count(materialsCitations.materialsCitationId) AS num FROM treatments INDEXED BY ix_treatments_authorityName JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId  WHERE treatments.authorityName LIKE @authorityName AND treatments.deleted = 0 GROUP BY country ORDER BY num DESC",
            "runtime": "0s 85.72ms"
        }
    },
    "runparams": {
        "authorityName": "miller%"
    }
}

const queries3 = {
    "count": {
        "query": "SELECT Count(DISTINCT treatments.treatmentId) AS num_of_records FROM treatments WHERE treatments.authorityName LIKE @authorityName",
        "runtime": "0s 82.65ms"
    },
    "full": {
        "query": "SELECT treatments.treatmentId, treatments.treatmentTitle, treatments.treatmentDOI, treatments.treatmentLSID, treatments.zenodoDep, treatments.zoobankId, treatments.articleId, treatments.articleTitle, treatments.articleAuthor, treatments.articleDOI, treatments.publicationDate, treatments.journalTitle, treatments.journalYear, treatments.journalVolume, treatments.journalIssue, treatments.pages, treatments.authorityName, treatments.authorityYear, treatments.kingdom, treatments.phylum, treatments.\"order\", treatments.family, treatments.genus, treatments.species, treatments.status, treatments.taxonomicNameLabel, treatments.rank, treatments.updateTime, treatments.checkinTime FROM treatments WHERE treatments.authorityName LIKE @authorityName ORDER BY treatments.treatmentId ASC LIMIT 30 OFFSET 0",
        "runtime": "0s 2.08ms"
    },
    "stats": {
        "treatments": {
            "query": "SELECT checkInYear, Count (DISTINCT treatments.treatmentId) AS num FROM treatments WHERE treatments.authorityName LIKE @authorityName GROUP BY 1",
            "runtime": "0s 6.71ms"
        },
        "materialsCitations": {
            "query": "SELECT checkInYear, Count (DISTINCT materialsCitations.materialsCitationId) AS num FROM treatments JOIN materialsCitations ON materialsCitations.treatmentId = treatments.treatmentId WHERE treatments.authorityName LIKE @authorityName GROUP BY 1",
            "runtime": "9s 302.16ms"
        },
        "figureCitations": {
            "query": "SELECT checkInYear, Count (DISTINCT figureCitations.figureCitationId) AS num FROM treatments JOIN figureCitations ON figureCitations.treatmentId = treatments.treatmentId WHERE treatments.authorityName LIKE @authorityName GROUP BY 1",
            "runtime": "19s 50.59ms"
        },
        "treatmentCitations": {
            "query": "SELECT checkInYear, Count (DISTINCT treatmentCitations.treatmentCitationId) AS num FROM treatments JOIN treatmentCitations ON treatmentCitations.treatmentId = treatments.treatmentId WHERE treatments.authorityName LIKE @authorityName GROUP BY 1",
            "runtime": "4s 856.71ms"
        },
        "bibRefCitations": {
            "query": "SELECT checkInYear, Count (DISTINCT bibRefCitations.bibRefCitationId) AS num FROM treatments JOIN bibRefCitations ON bibRefCitations.treatmentId = treatments.treatmentId WHERE treatments.authorityName LIKE @authorityName GROUP BY 1",
            "runtime": "14s 254.14ms"
        },
        "locations": {
            "query": "SELECT materialsCitations.country, Count(materialsCitations.materialsCitationId) AS num FROM treatments JOIN materialsCitations ON treatments.treatmentId = materialsCitations.treatmentId WHERE treatments.authorityName LIKE @authorityName GROUP BY country ORDER BY num DESC",
            "runtime": "0s 85.72ms"
        }
    },
    "runparams": {
        "authorityName": "miller%"
    }
}

const runQueries = (queries) => {
    
    const runparams = queries.runparams;

    for (let [queryType, sql] of Object.entries(queries)) {
        if (queryType !== 'runparams') {
            if (queryType === 'stats') {
                sql.runparams = runparams;
                runQueries(sql);
            }
            else {
                //const query = `EXPLAIN QUERY PLAN ${sql.query}`;
                const query = sql.query;

                let t = process.hrtime();
                try {
                    const res = db.prepare(query).all(runparams);
                    t = process.hrtime(t);
                    console.log(queryType, utils.timerFormat(t));
                }
                catch (error) {
                    console.log(error);
                }
            }
        }
    }
}

runQueries(queries3);

// SELECT 
//     checkInYear, 
//     Count (DISTINCT treatmentCitations.treatmentCitationId) AS num 
// FROM 
//     treatments 
//     JOIN treatmentCitations ON treatmentCitations.treatmentId = treatments.treatmentId 
// WHERE 
//     treatments.authorityName LIKE 'miller%' 
//     AND treatments.deleted = 0 
//     AND treatmentCitations.deleted = 0 
// GROUP BY 1

// QUERY PLAN
// |--SEARCH treatments USING INDEX ix_treatments_authorityName (deleted=? AND authorityName>? AND authorityName<?)
// |--SEARCH treatmentCitations USING INDEX ix_treatmentCitations_treatmentId (deleted=? AND treatmentId=?)
// |--USE TEMP B-TREE FOR GROUP BY
// `--USE TEMP B-TREE FOR count(DISTINCT)

// SELECT 
//     checkInYear, 
//     Count (DISTINCT figureCitations.figureCitationId) AS num 
// FROM 
//     treatments 
//     JOIN figureCitations ON figureCitations.treatmentId = treatments.treatmentId 
// WHERE 
//     treatments.authorityName LIKE 'miller%' 
//     AND treatments.deleted = 0 
//     AND figureCitations.deleted = 0 
// GROUP BY 1

// QUERY PLAN
// |--SEARCH figureCitations USING COVERING INDEX ix_figureCitations_figureCitationId_treatmentId_figureNum (deleted=?)
// |--SEARCH treatments USING INDEX ix_treatments_treatmentId (deleted=? AND treatmentId=?)
// |--USE TEMP B-TREE FOR GROUP BY
// `--USE TEMP B-TREE FOR count(DISTINCT)

// SELECT checkInYear, Count (DISTINCT treatmentCitations.treatmentCitationId) AS num FROM treatments INDEXED BY ix_treatments_authorityName JOIN treatmentCitations ON treatmentCitations.treatmentId = treatments.treatmentId WHERE treatments.authorityName LIKE 'miller%' AND treatments.deleted = 0 AND treatmentCitations.deleted = 0 GROUP BY 1;

// SELECT checkInYear, Count (DISTINCT figureCitations.figureCitationId) AS num FROM treatments INDEXED BY ix_treatments_authorityName JOIN figureCitations INDEXED BY ix_figureCitations_treatmentId ON figureCitations.treatmentId = treatments.treatmentId WHERE treatments.authorityName LIKE 'miller%' AND treatments.deleted = 0 AND figureCitations.deleted = 0 GROUP BY 1

// EXPLAIN QUERY PLAN SELECT checkInYear, Count (DISTINCT figureCitations.figureCitationId) AS num FROM treatments JOIN figureCitations ON figureCitations.treatmentId = treatments.treatmentId WHERE treatments.authorityName LIKE 'miller%' GROUP BY 1;

// EXPLAIN QUERY PLAN SELECT checkInYear, Count (DISTINCT treatments.treatmentId) AS num FROM treatments WHERE treatments.authorityName LIKE 'miller%' GROUP BY 1;

SELECT treatments.checkInYear, Count (DISTINCT materialsCitations.materialsCitationId) AS num FROM treatments CROSS JOIN materialsCitations ON materialsCitations.treatmentId = treatments.treatmentId WHERE treatments.authorityName LIKE 'miller%' GROUP BY 1;

SELECT checkInYear, Count (DISTINCT figureCitations.figureCitationId) AS num FROM treatments JOIN figureCitations ON figureCitations.treatmentId = treatments.treatmentId WHERE treatments.authorityName LIKE 'miller%' GROUP BY 1;