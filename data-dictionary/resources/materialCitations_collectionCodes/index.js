import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const materialCitations_collectionCodes = {

    // descriptive title of the datastore
    title: 'Material Citations by Collection Codes',

    // single word name of the table
    name: 'materialCitations_collectionCodes',
    
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

    summary: 'A cross-table between materialCitations and collectionCodes',
    description: "A cross-table for many-to-many relationships between materialCitations and collectionCodes",
    
    // TABLE | VIEW | VIRTUAL TABLE
    tableType: 'TABLE',

    // SQLite extension used to make a virtual table
    sqliteExtension: '',

    // view source if tableType is VIEW
    viewSource: '',

    // boolean flag if table is without rowid
    isWithoutRowid: true,

    params,
    triggers,
    inserts,
    
    // data source is 'zenodeo' | 'zenodo'
    source: 'zenodeo',

    // swagger API tags
    tags: [ 'zenodeo' ]
}