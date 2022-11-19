'use strict';

import { Config } from '@punkish/zconfig';
const config = new Config().settings;

import * as treatments from './treatments/treatments.js';
import * as treatmentcitations from './treatments/treatmentcitations.js';
import * as treatmentauthors from './treatments/treatmentauthors.js';
import * as bibrefcitations from './treatments/bibrefcitations.js';
import * as figurecitations from './treatments/figurecitations.js';
import * as materialcitations from './treatments/materialcitations.js';
import * as treatmentimages from './treatments/treatmentimages.js';
import * as stats from './stats/stats.js';

const dbType = config.dbType;
const parts = {
    stats: [ stats ]
}

if (dbType === 'consolidated') {
    parts.treatments = [
        treatments,
        treatmentcitations,
        treatmentauthors,
        bibrefcitations,
        figurecitations,
        materialcitations,
        treatmentimages
    ];
}
else if (dbType === 'exploded') {
    parts.treatments = [ treatments ];
    parts.treatmentcitations = [ treatmentcitations ];
    parts.treatmentauthors = [ treatmentauthors ];
    parts.bibrefcitations = [ bibrefcitations ];
    parts.figurecitations = [ figurecitations ];
    parts.materialcitations = [ materialcitations ];
    parts.treatmentimages = [ treatmentimages ];
}

const dbs = {};
for (let [db, value] of Object.entries(parts)) {
    dbs[db] = { tables: [], indexes: [], triggers: [] };

    value.forEach(d => {
        dbs[db].tables.push(...d.tables);

        if (d.indexes) {
            dbs[db].indexes.push(...d.indexes);
        }

        if (d.triggers) {
            dbs[db].triggers.push(...d.triggers);
        }
    })
}

export { dbs }