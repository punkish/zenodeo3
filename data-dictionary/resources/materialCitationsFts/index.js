import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const materialCitationsFts = {

    // descriptive title of the datastore
    title: 'Material Citations Full Text',

    // single word name of the table
    name: 'materialCitationsFts',
    
    // name of the database, also used as the name of the 
    // file on disk with '.sqlite' extension
    //
    // name of the schema, if ATTACHED as a separate database
    singleDatabase: {
        name: 'zenodeo',
        schema: 'main'
    },
    attachedDatabase: {
        name: 'materialCitations',
        schema: 'mc'
    },

    summary: 'Full text of Material Citations',
    description: "…",
    
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