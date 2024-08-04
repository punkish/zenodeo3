import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const journals = {

    // descriptive title of the datastore
    title: 'Journals',

    // single word name of the table
    name: 'journals',
    
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

    summary: 'Fetches journals',
    description: "Treatments are a part of articles published in journals",
    
    // TABLE | VIEW | VIRTUAL TABLE
    tableType: 'TABLE',

    // SQLite extension used to make a virtual table
    sqliteExtension: '',

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