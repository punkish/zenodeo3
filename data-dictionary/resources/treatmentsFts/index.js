import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const treatmentsFts = {

    // descriptive title of the datastore
    title: 'Treatments fulltext',

    // single word name of the table
    name: 'treatmentsFts',
    
    // name of the database, also used as the name of the 
    // file on disk with '.sqlite' extension
    //
    // name of the schema, if ATTACHED as a separate database
    // singleDatabase: {
    //     name: 'zenodeo',
    //     schema: 'main'
    // },
    // attachedDatabase: {
    //     name: 'treatments',
    //     schema: 'tr'
    // },

    database: {
        name: 'zenodeo',
        schema: 'main'
    },
    
    summary: 'Full text of treatments',
    description: '…',
    
    // TABLE | VIEW | VIRTUAL TABLE
    tableType: 'VIRTUAL TABLE',
    
    // SQLite extension used to make a virtual table
    sqliteExtension: 'fts5',

    // view source if tableType is VIEW
    viewSource: '',

    // boolean flag if table is without rowid
    isWithoutRowid: false,

    params,
    triggers,
    inserts,
    
    // data source is 'zenodeo' | 'zenodo'
    source: 'zenodeo',

    // swagger API tags
    tags: [ 'zenodeo' ]
}