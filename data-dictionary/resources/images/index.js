import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';
//import { queries } from './queries.js';

export const images = {

    // descriptive title of the datastore
    title: 'Treatment Images',

    // single word name of the table
    name: 'images',
    
    // name of the database, also used as the name of the 
    // file on disk with '.sqlite' extension
    //
    // name of the schema, if ATTACHED as a separate database
    singleDatabase: {
        name: 'zenodeo',
        schema: 'main'
    },
    // attachedDatabase: {
    //     name: 'figureCitations',
    //     schema: 'fc'
    // },

    summary: 'Fetches treatment-related images',
    description: "Treatments are well-defined parts of articles that describe the particular usage of a scientific name by an author at the time of the publication. Treatments have images.",
    
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
    //queries,
    
    // data source is 'zenodeo' | 'zenodo'
    source: 'zenodeo',

    // swagger API tags
    tags: [ 'zenodeo' ]
}