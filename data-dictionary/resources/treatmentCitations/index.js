import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const treatmentCitations = {

    // descriptive title of the datastore
    title: 'Treatment Citations',

    // single word name of the table
    name: 'treatmentCitations',
    
    // name of the database, also used as the name of the 
    // file on disk with '.sqlite' extension
    //
    // name of the schema, if ATTACHED as a separate database
    // singleDatabase: {
    //     name: 'zenodeo',
    //     schema: 'main'
    // },
    // attachedDatabase: {
    //     name: 'treatmentCitations',
    //     schema: 'tc'
    // },

    database: {
        name: 'zenodeo',
        schema: 'main'
    },

    summary: 'Fetches treatment citations of the treatments',
    description: "…",
    
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