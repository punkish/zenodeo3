import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const binomens = {

    // descriptive title of the datastore
    title: 'Binomens',

    // single word name of the table
    name: 'binomens',
    
    // Name of the database, also used as the name of the 
    // file on disk with '.sqlite' extension.
    // Name of the schema, if ATTACHED as a separate database
    database: {
        name: 'zenodeo',
        schema: 'main'
    },

    summary: 'Species binomens',
    description: "…",
    
    // TABLE | VIEW | VIRTUAL TABLE
    tableType: 'VIRTUAL TABLE',

    // SQLite extension used to make a virtual table
    sqliteExtension: 'FTS5',

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