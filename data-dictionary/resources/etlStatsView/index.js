import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const etlStatsView = {

    // descriptive title of the datastore
    title: 'ETL Processes',

    // single word name of the table
    name: 'etlStatsView',
    
    // Name of the database, also used as the name of the 
    // file on disk with '.sqlite' extension.
    // Name of the schema, if ATTACHED as a separate database
    database: {
        name: 'zenodeo',
        schema: 'main'
    },
    
    summary: 'Simplified view of ETL processes',
    description: "…",
    
    // TABLE | VIEW | VIRTUAL TABLE
    tableType: 'VIEW',

    // SQLite extension used to make a virtual table
    sqliteExtension: '',

    // view source if tableType is VIEW
    viewSource: 'etlstats',

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