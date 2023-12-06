import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const journalsByYears = {

    // descriptive title of the datastore
    title: 'Journal frequency by Year',

    // single word name of the table
    name: 'journalsByYears',
    
    // name of the database, also used as the name of the 
    // file on disk with '.sqlite' extension
    //
    // name of the schema, if ATTACHED as a separate database
    singleDatabase: {
        name: 'zenodeo',
        schema: 'main'
    },
    // attachedDatabase: {
    //     name: 'treatments',
    //     schema: 'tr'
    // },

    summary: 'A table of frequency of journals by year',
    description: "Stores the number of times a journal was processed in a given year",

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