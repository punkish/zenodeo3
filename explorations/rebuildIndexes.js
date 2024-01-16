import { initDb } from '../lib/dbconn.js';
const db = initDb().conn;

const treatmentCols = [
    'articleAuthor',
    'articleDOI',
    'articleTitle',
    'authorityName',
    'authorityYear',
    'checkinTime',
    'journalYear',
    'publicationDate',
    'status',
    'taxonomicNameLabel',
    'treatmentDOI',
    'treatmentTitle',
    'updateTime',
    'validGeo',
    // 'treatmentVersion',
    // 'articleId',
    // 'publicationDateMs',
    // 'journals_id',
    // 'kingdoms_id',
    // 'phyla_id',
    // 'classes_id',
    // 'orders_id',
    // 'families_id',
    // 'genera_id',
    // 'species_id',
    // 'rank',
    // 'deleted',
];

const imagesCols = [
    'figureDoiOriginal',
    'figureDoi',
    'captionText',
    'treatments_id'
];

function dropIndivIndexes(resource, cols) {
    cols.forEach(col => {
        const ix = `ix_${resource}_${col}`;
        db.prepare(`DROP INDEX IF EXISTS ${ix}`).run();
    });
}

function createCompoundIndex(resource, cols) {
    db.prepare(`CREATE INDEX IF NOT EXISTS ix_${resource}_allCols ON ${resource} (
        ${cols.join(', ')}
    )`).run();
}

function dropCompoundIndex(resource) {
    console.log(`dropping compound index for ${resource}`);
    db.prepare(`DROP INDEX IF EXISTS idx_${resource}_allCols`).run();
}

function createIndivIndexes(resource, cols) {
    console.log(`building indiv index for ${resource}`);
    cols.forEach(col => {
        const ix = `ix_${resource}_${col}`;
        db.prepare(`DROP INDEX IF EXISTS ${ix}`).run();
        db.prepare(`CREATE INDEX IF NOT EXISTS ${ix} ON ${resource} (${col}, id, treatments_id)`).run();
    })
}

//dropIndivIndexes('treatments', treatmentCols);
dropIndivIndexes('images', imagesCols);

// createCompoundIndex('treatments', treatmentCols);
// createCompoundIndex('images', imagesCols);

// dropCompoundIndex('treatments');
// dropCompoundIndex('images');

//createIndivIndexes('treatments', treatmentCols);
createIndivIndexes('images', imagesCols);