'use strict';

// The following two lines make "require" available
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// const config = require('config');
import config from 'config';
const truebug = config.get('truebug');

const Database = require('better-sqlite3');

const db = {
    treatments: new Database(config.get('db.treatments')),
    stats: new Database(config.get('db.stats')),
}

const getCounts = () => {
    const dbs = [
        'treatments',
        'treatmentimages',
        'figurecitations',
        'materialscitations',
        'bibrefcitations',
        'treatmentcitations'
    ];

    const counts = [];
    dbs.forEach(table => {
        const count = db.treatments.prepare(`SELECT Count(*) AS c FROM ${table}`).get().c;
        counts.push({ table, count });
    })

    console.table(counts);
}

getCounts();