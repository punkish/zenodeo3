import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const materialCitationsRtree = {

    // descriptive title of the datastore
    name: 'materialCitationsRtree',

    // single word name of the table
    schema: 'materialCitations',
    
    // Name of the database, also used as the name of the 
    // file on disk with '.sqlite' extension.
    // Name of the schema, if ATTACHED as a separate database
    database: {
        name: 'zenodeo',
        schema: 'main'
    },

    summary: 'Location information stored using R*Tree',
    description: 'Location information for material citations',
    
    // TABLE | VIEW | VIRTUAL TABLE
    tableType: 'VIRTUAL TABLE',
    
    // SQLite extension used to make a virtual table
    sqliteExtension: 'rtree',

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