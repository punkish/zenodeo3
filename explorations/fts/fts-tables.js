import { Config } from '@punkish/zconfig';
const config = new Config().settings;
import Database from "better-sqlite3";

const dir = './explorations/fts/data';
const db = new Database(`${dir}/treatments.sqlite`);
db.prepare(`ATTACH '${dir}/treatmentsFts.sqlite' AS fts1`).run();
db.prepare(`ATTACH '${dir}/treatmentsFtsContentless.sqlite' AS fts2`).run();
db.prepare(`ATTACH '${dir}/treatmentsFtsExtContent.sqlite' AS fts3`).run();

function createVtabs() {
    let start = process.hrtime.bigint();
    process.stdout.write('creating treatmentsFts… ');

    db.prepare(`
    CREATE VIRTUAL TABLE IF NOT EXISTS fts1.treatmentsFts USING fts5 (
        fulltext,
        content_rowid='id'
    )`).run();

    // populating treatmentsFts… took 69431 ms
    db.prepare(
        'INSERT INTO fts1.treatmentsFts SELECT fulltext FROM treatments'
    ).run();

    let end = process.hrtime.bigint();
    let time = (Number(end - start) / 1e6).toFixed(0);
    console.log(`took ${time} ms`);

    start = process.hrtime.bigint();
    process.stdout.write('creating treatmentsFtsTri… ');

    db.prepare(`
    CREATE VIRTUAL TABLE IF NOT EXISTS fts1.treatmentsFtsTri USING fts5 (
        fulltext,
        content_rowid='id',
        tokenize='trigram'
    )`).run();

    // populating treatmentsFtsTri… took 351747 ms
    db.prepare(
        'INSERT INTO fts1.treatmentsFtsTri SELECT fulltext FROM treatments'
    ).run();

    end = process.hrtime.bigint();
    time = (Number(end - start) / 1e6).toFixed(0);
    console.log(`took ${time} ms`);
    
}

function createContentlessVtabs() {
    let start = process.hrtime.bigint();
    process.stdout.write('creating contentless treatmentsFts… ');

    db.prepare(`
    CREATE VIRTUAL TABLE IF NOT EXISTS fts2.treatmentsFtsContentless USING fts5 (
        fulltext,
        content='',
        content_rowid='id'
    )`).run();

    // populating treatmentsFts… took 66224 ms
    db.prepare(
        'INSERT INTO fts2.treatmentsFtsContentless SELECT fulltext FROM treatments'
    ).run();

    let end = process.hrtime.bigint();
    let time = (Number(end - start) / 1e6).toFixed(0);
    console.log(`took ${time} ms`);

    start = process.hrtime.bigint();
    process.stdout.write('creating contentless treatmentsFtsTri… ');

    db.prepare(`
    CREATE VIRTUAL TABLE IF NOT EXISTS fts2.treatmentsFtsTriContentless USING fts5 (
        fulltext,
        content='',
        content_rowid='id',
        tokenize='trigram'
    )`).run();

    // populating treatmentsFtsTri… took 383966 ms
    db.prepare(
        'INSERT INTO fts2.treatmentsFtsTriContentless SELECT fulltext FROM treatments'
    ).run();

    end = process.hrtime.bigint();
    time = (Number(end - start) / 1e6).toFixed(0);
    console.log(`took ${time} ms`);
    
}

function createExtContentVtabs() {
    let start = process.hrtime.bigint();
    process.stdout.write('creating external content treatmentsFts… ');

    db.prepare(`
    CREATE VIRTUAL TABLE IF NOT EXISTS fts3.treatmentsFtsExtContent USING fts5 (
        fulltext,
        content='treatments',
        content_rowid='id'
    )`).run();

    // populating treatmentsFts… took 66426 ms
    db.prepare(
        'INSERT INTO fts3.treatmentsFtsExtContent SELECT fulltext FROM treatments'
    ).run();

    let end = process.hrtime.bigint();
    let time = (Number(end - start) / 1e6).toFixed(0);
    console.log(`took ${time} ms`);

    start = process.hrtime.bigint();
    process.stdout.write('creating external content treatmentsFtsTri… ');

    db.prepare(`
    CREATE VIRTUAL TABLE IF NOT EXISTS fts3.treatmentsFtsTriExtContent USING fts5 (
        fulltext,
        content='treatments',
        content_rowid='id',
        tokenize='trigram'
    )`).run();

    // populating treatmentsFtsTri… took 383966 ms
    db.prepare(
        'INSERT INTO fts3.treatmentsFtsTriExtContent SELECT fulltext FROM treatments'
    ).run();

    end = process.hrtime.bigint();
    time = (Number(end - start) / 1e6).toFixed(0);
    console.log(`took ${time} ms`);
    
}

function compareSelects({ queryName, sql }) {
    const start = process.hrtime.bigint();

    try {
        const res = db.prepare(sql).all();
        const end = process.hrtime.bigint();
        const time = (Number(end - start) / 1e6).toFixed(2);
        console.log(`${queryName}: ${res.length} rows in ${time} ms`);
        console.table(res.slice(0, 10));
    }
    catch(error) {
        console.error(error);
    }

}

function query(term) {

    const queries = {

        // 1289 rows in 18064 ms
        //     treatments_like: `
// SELECT 
//     treatmentId, treatmentTitle 
// FROM 
//     treatments 
// WHERE 
//     fulltext LIKE '%hake%'`,

        // 43 rows in 6 ms
//         fts_match: `
// SELECT 
//     treatments.treatmentId, 
//     snippet(treatmentsFts, 0, '<span class="fts">', '</span>', '…', 10) AS snip
// FROM 
//     treatments 
//     JOIN fts1.treatmentsFts ON treatments.id = fts1.treatmentsFts.rowid
// WHERE 
//     fts1.treatmentsFts.fulltext MATCH '${term}'`,

//         // 1289 rows in 157 ms
        ftsTri_like: `
SELECT 
    treatments.treatmentId, 
    snippet(treatmentsFtsTri, 0, '<span class="fts">', '</span>', '…', 70) AS snip
FROM 
    treatments 
    JOIN fts1.treatmentsFtsTri ON treatments.id = fts1.treatmentsFtsTri.rowid 
WHERE 
    fts1.treatmentsFtsTri.fulltext LIKE '%${term}%'`,

    // 43 rows in 6 ms
//         fts_match_contentless: `
// SELECT 
//     treatments.treatmentId, 
//     snippet(treatments.fulltext, 0, '<span class="fts">', '</span>', '…', 10) AS snip
// FROM 
//     treatments 
//     JOIN fts2.treatmentsFtsContentless 
//         ON treatments.id = fts2.treatmentsFtsContentless.rowid
// WHERE 
//     fts2.treatmentsFtsContentless.fulltext MATCH '${term}'`,

        // 1289 rows in 157 ms
//         ftsTri_like_contentless: `
// SELECT 
//     treatments.treatmentId
// FROM 
//     treatments 
//     JOIN fts2.treatmentsFtsTriContentless 
//         ON treatments.id = fts2.treatmentsFtsTriContentless.rowid 
// WHERE 
//     fts2.treatmentsFtsTriContentless.fulltext LIKE '%${term}%'`,

    // 43 rows in 6 ms
//     fts_match_extcontent: `
// SELECT 
//     treatments.treatmentId
// FROM 
//     treatments 
//     JOIN fts3.treatmentsFtsExtContent 
//         ON treatments.id = fts3.treatmentsFtsExtContent.rowid
// WHERE 
//     fts3.treatmentsFtsExtContent.fulltext MATCH '${term}'`,

        // 1289 rows in 157 ms
//         ftsTri_like_extcontent: `
// SELECT 
//     treatments.treatmentId
// FROM 
//     treatments 
//     JOIN fts3.treatmentsFtsTriExtContent 
//         ON treatments.id = fts3.treatmentsFtsTriExtContent.rowid 
// WHERE 
//     fts3.treatmentsFtsTriExtContent.fulltext LIKE '%${term}%'`
    };

    for (const [queryName, sql] of Object.entries(queries)) {
        compareSelects({ queryName, sql });
    }
}

// attachExternalDbs();
// createVtabs();
//createContentlessVtabs();
//createExtContentVtabs();
query('hake');

