import * as treatments from './treatments/treatments.js';
import * as treatmentcitations from './treatments/treatmentcitations.js';
import * as treatmentauthors from './treatments/treatmentauthors.js';
import * as bibrefcitations from './treatments/bibrefcitations.js';
import * as figurecitations from './treatments/figurecitations.js';
import * as materialcitations from './treatments/materialcitations.js';
import * as treatmentimages from './treatments/treatmentimages.js';
import * as stats from './stats/stats.js';

const parts = {
    treatments: [
        treatments,
        treatmentcitations,
        treatmentauthors,
        bibrefcitations,
        figurecitations,
        materialcitations,
        treatmentimages
    ],
    stats: [
        stats
    ]
}

const dbs = {};
for (let [db, value] of Object.entries(parts)) {
    dbs[db] = { tables: [], indexes: [] };

    value.forEach(d => {
        dbs[db].tables.push(...d.tables);
        dbs[db].indexes.push(...d.indexes);
    })
}

export { dbs }