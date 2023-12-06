import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const treatments = {

    // descriptive title of the datastore
    title: 'Treatments',

    // single word name of the table
    name: 'treatments',
    
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

    summary: 'Fetches treatments',
    description: "Treatments are well-defined parts of articles that describe the particular usage of a scientific name by an author at the time of the publication. In other words, each scientific name has one or more treatments, depending on whether there exists only an original description of a species, or there are subsequent re-descriptions. Similar to bibliographic references, treatments can be cited, and subsequent usages of names cite earlier treatments.",
    
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