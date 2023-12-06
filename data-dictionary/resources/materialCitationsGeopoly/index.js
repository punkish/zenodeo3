import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const materialCitationsGeopoly = {

    // descriptive title of the datastore
    name: 'materialCitationsGeopoly',

    // single word name of the table
    schema: 'materialCitations',
    
    // name of the database, also used as the name of the 
    // file on disk with '.sqlite' extension
    //
    // name of the schema, if ATTACHED as a separate database
    singleDatabase: {
        name: 'zenodeo',
        schema: 'main'
    },
    // attachedDatabase: {
    //     name: 'materialCitations',
    //     schema: 'mc'
    // },

    summary: 'Location information stored using geopoly',
    description: 'Location information for material citations',
    
    // TABLE | VIEW | VIRTUAL TABLE
    tableType: 'VIRTUAL TABLE',
    
    // SQLite extension used to make a virtual table
    sqliteExtension: 'geopoly',

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