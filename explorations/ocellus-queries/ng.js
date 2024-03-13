import process from 'node:process';
import { initDb } from '../../lib/dbconn.js';
const db = initDb().conn;

// count all images for a WHERE
function getCountSql() {
    return `SELECT Count(DISTINCT images_id) AS num_of_records
FROM tmp`;
}

function createTmpTable(from, where) {
    const dropTmp = 'DROP TABLE IF EXISTS tmp';
    const createTmp = `CREATE TEMP TABLE tmp AS SELECT
    images.id AS images_id,
    images.httpUri AS httpUri,
    images.captionText AS captionText,
    treatments.id AS treatments_id,
    treatments.treatmentId AS treatmentsId,
    treatments.treatmentTitle AS treatmentTitle,
    treatments.treatmentDOI AS treatmentDOI,
    treatments.zenodoDep AS zenodoDep,
    treatments.articleTitle AS articleTitle,
    treatments.articleAuthor AS articleAuthor
FROM
    ${from}
WHERE
    ${where}
GROUP BY images.id`;

    (db.transaction(() => {
        db.prepare(dropTmp).run();
        db.prepare(createTmp).run();
    }))();
}

// get 30 rows of selected columns for a WHERE
function getFullSql() {
    return `SELECT
    images_id,
    httpUri,
    captionText,
    treatments_id,
    treatmentsId,
    treatmentTitle,
    treatmentDOI,
    zenodoDep,
    articleTitle,
    articleAuthor
FROM tmp 
ORDER BY images_id ASC
LIMIT 30 OFFSET 0`;
}

// get number of images checked in for a WHERE
function getYearlyCountImages () {
    return `WITH t(year, num_of_records) AS (
    SELECT 
        strftime('%Y', treatments.checkinTime/1000, 'unixepoch') AS year, 
        Count(DISTINCT images.id) AS num_of_records 
    FROM images JOIN 
        treatments ON images.treatments_id = treatments.id 
    WHERE
        treatments.id IN (SELECT treatments_id FROM tmp)
    GROUP BY year
    ORDER BY year ASC
)
SELECT 
    Row_number() OVER (ORDER BY year) AS row_num,
    year, 
    num_of_records,
    Sum(num_of_records) OVER (ORDER BY year) AS cum_count
FROM t`;
}

function getYearlyCountSpecies () {
    return `WITH t(year, num_of_records) AS (
    SELECT 
        strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
        Count(DISTINCT species."id") AS num_of_records 
    FROM treatments JOIN 
        species ON treatments.species_id = species.id 
    WHERE 
        treatments.id IN (SELECT treatments_id FROM tmp)
    GROUP BY year
    ORDER BY year ASC
)
SELECT 
    Row_number() OVER (ORDER BY year) AS row_num,
    year, 
    num_of_records,
    Sum(num_of_records) OVER (ORDER BY year) AS cum_count
FROM t`
}

function getYearlyCountJournals() {
    return `WITH t(year, num_of_records) AS (
    SELECT 
        strftime('%Y', treatments."checkinTime"/1000, 'unixepoch') AS year, 
        Count(DISTINCT journals."id") AS num_of_records 
    FROM treatments JOIN 
        journals ON treatments.journals_id = journals.id    
    WHERE 
        treatments.id IN (SELECT treatments_id FROM tmp)
    GROUP BY year
    ORDER BY year ASC
)
SELECT 
    Row_number() OVER (ORDER BY year) AS row_num,
    year, 
    num_of_records,
    Sum(num_of_records) OVER (ORDER BY year) AS cum_count
FROM t`
}

function sqlRunner(sql, nodata) {
    let t = process.hrtime();
    let res;

    if (nodata) {
        db.prepare(sql).run();
    }
    else {
        res = db.prepare(sql).all();
    }
    
    t = process.hrtime(t);
    return { res, t };
}

function init2(from, where) {
    const result = {};

    createTmpTable(from, where);

    const countSql = getCountSql(from, where);
    result.countSql = countSql;
    const { res, t } = sqlRunner(countSql);
    
    if (res[0].num_of_records) {
        result.num_of_records = res[0].num_of_records;
        result.runtime = t;
        
        const fullSql = getFullSql(from, where);
        result.fullSql = fullSql;
        const fullRes = sqlRunner(fullSql);
        result.records = fullRes.res;
        result.runtime[0] += fullRes.t[0];
        result.runtime[1] += fullRes.t[1];

        const imagesYearlySql = getYearlyCountImages(from, where);
        result.imagesYearlySql = imagesYearlySql;
        const imagesYearlyCounts = sqlRunner(imagesYearlySql);
        result.imagesYearlyCounts = imagesYearlyCounts.res;
        result.runtime[0] += imagesYearlyCounts.t[0];
        result.runtime[1] += imagesYearlyCounts.t[1];

        const speciesYearlySql = getYearlyCountSpecies(from, where);
        result.speciesYearlySql = speciesYearlySql;
        const speciesYearlyCounts = sqlRunner(speciesYearlySql);
        result.speciesYearlyCounts = speciesYearlyCounts.res;
        result.runtime[0] += speciesYearlyCounts.t[0];
        result.runtime[1] += speciesYearlyCounts.t[1];

        const journalsYearlySql = getYearlyCountJournals(from, where);
        result.journalsYearlySql = journalsYearlySql;
        const journalsYearlyCounts = sqlRunner(journalsYearlySql);
        result.journalsYearlyCounts = journalsYearlyCounts.res;
        result.runtime[0] += journalsYearlyCounts.t[0];
        result.runtime[1] += journalsYearlyCounts.t[1];
    }
    else {
        result.num_of_records = 0;
        result.runtime = t;
    }

    return result;
}

export { init2 };