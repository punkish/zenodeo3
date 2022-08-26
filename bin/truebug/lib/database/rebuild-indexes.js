'use strict';

import process from 'node:process';
import { Config } from '@punkish/zconfig';
const config = new Config().settings;

import Database from 'better-sqlite3';
const db = {
    treatments: new Database(config.db['treatments-testing']),
};

const dropIndexes = () => {
    const sql = "SELECT name FROM sqlite_master WHERE name LIKE 'ix_%'";
    const indexes = db.treatments.prepare(sql).all();

    indexes.forEach(idx => {
        const sql = `DROP INDEX ${idx.name}`;
        console.log(sql);
        db.treatments.prepare(sql).run()
    });
}

const createIndexes = () => {
    const tables = [
        {
            table: 'treatments',
            abbrev: 'tr',
            columns: [
                //{ name: 'treatmentId',        type: 'text' },
                { name: 'treatmentTitle',     type: 'text' },
                { name: 'articleTitle',       type: 'text' },
                { name: 'publicationDate',    type: 'date' },
                { name: 'journalTitle',       type: 'text' },
                { name: 'journalYear',        type: 'int'  },
                { name: 'authorityName',      type: 'text' },
                { name: 'taxonomicNameLabel', type: 'text' },
                { name: 'kingdom',            type: 'text' },
                { name: 'phylum',             type: 'text' },
                { name: '"order"',            type: 'text' },
                { name: 'family',             type: 'text' },
                { name: 'genus',              type: 'text' },
                { name: 'species',            type: 'text' },
                { name: 'status',             type: 'text' },
                { name: 'rank',               type: 'text' },
                { name: 'checkinTime',        type: 'int'  },
                { name: 'updateTime',         type: 'int'  },
                { name: 'deleted',            type: 'int'  },
                { name: 'checkInYear',        type: 'int'  }
            ]
        },
        {
            table: 'treatmentCitations',
            abbrev: 'tc',
            columns: [
                { name: 'treatmentId',       type: 'text' },
                { name: 'treatmentCitation', type: 'text' },
                { name: 'refString',         type: 'date' }
            ]
        },
        {
            table: 'treatmentImages',
            abbrev: 'ti',
            columns: [
                { name: 'treatmentId',       type: 'text' }
            ]
        },
        {
            table: 'treatmentAuthors',
            abbrev: 'ta',
            columns: [
                { name: 'treatmentId',       type: 'text' },
                { name: 'treatmentAuthorId', type: 'text' },
                { name: 'treatmentAuthor',   type: 'text' },
                { name: 'deleted',           type: 'int'  },
            ]
        },
        {
            table: 'bibRefCitations',
            abbrev: 'bc',
            columns: [
                { name: 'treatmentId',      type: 'text' },
                { name: 'bibRefCitationId', type: 'text' },
                { name: 'year',             type: 'text' },
                { name: 'deleted',          type: 'int'  }
            ]
        },
        {
            table: 'figureCitations',
            abbrev: 'fc',
            columns: [
                { name: 'treatmentId',      type: 'text' },
                { name: 'figureCitationId', type: 'text' },
                { name: 'httpUri',          type: 'text' },
                { name: 'deleted',          type: 'int'  }
            ]
        },
        {
            table: 'materialsCitations',
            abbrev: 'mc',
            columns: [
                { name: 'treatmentId',         type: 'text' },
                { name: 'materialsCitationId', type: 'text' },
                { name: 'collectingDate',      type: 'text' },
                { name: 'collectionCode',      type: 'text' },
                { name: 'collectorName',       type: 'text' },
                { name: 'country',             type: 'text' },
                { name: 'collectingRegion',    type: 'text' },
                { name: 'municipality',        type: 'text' },
                { name: 'county',              type: 'text' },
                { name: 'stateProvince',       type: 'text' },
                { name: 'location',            type: 'text' },
                { name: 'locationDeviation',   type: 'text' },
                { name: 'specimenCountFemale', type: 'text' },
                { name: 'specimenCountMale',   type: 'text' },
                { name: 'specimenCount',       type: 'text' },
                { name: 'specimenCode',        type: 'text' },
                { name: 'typeStatus',          type: 'text' },
                { name: 'determinerName',      type: 'text' },
                { name: 'collectedFrom',       type: 'text' },
                { name: 'collectingMethod',    type: 'text' },
                { name: 'latitude',            type: 'int'  },
                { name: 'longitude',           type: 'int'  },
                { name: 'elevation',           type: 'int'  },
                { name: 'validGeo',            type: 'int'  },
                { name: 'isOnLand',            type: 'int'  },
                { name: 'validGeo',            type: 'int'  },
                { name: 'deleted',             type: 'int'  }
            ]
        },
        // {
        //     table: 'materialsCitations_x_collectionCodes',
        //     abbrev: 'mxc',
        //     columns: [
        //         { name: 'deleted',             type: 'int'  }
        //     ]
        // },
        {
            table: 'collectionCodes',
            abbrev: 'cc',
            columns: [
                { name: 'collectionCode',      type: 'text' }
            ]
        }
    ];

    tables.forEach(t => {
        t.columns.forEach(c => {
            const col = c.name === '"order"' ? 'order' : c.name;
            //let sql = `CREATE INDEX IF NOT EXISTS ix_${t.abbrev}_${col} ON ${t.table} (${c.name} ${c.type === 'text' ? 'COLLATE NOCASE' : ''})`;
            let sql = `CREATE INDEX IF NOT EXISTS ix_${t.abbrev}_${col} ON ${t.table} (${c.name})`
            console.log(sql);
            db.treatments.prepare(sql).run()
        })
    });
}

const postBuild = () => {
    console.log('now vacuuming…')
    db.treatments.prepare('VACUUM').run();
    console.log('now analyzing…')
    db.treatments.prepare('ANALYZE').run();
}

let t;
t = process.hrtime();
dropIndexes();
t = process.hrtime(t);
console.log('drop took ' + t);

t = process.hrtime();
createIndexes();
t = process.hrtime(t);
console.log('create took ' + t);

// t = process.hrtime();
// postBuild()
// t = process.hrtime(t);
// console.log('post-build took ' + t);