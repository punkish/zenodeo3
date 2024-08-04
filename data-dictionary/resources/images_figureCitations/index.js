import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const images_figureCitations = {

    // descriptive title of the datastore
    title: 'Images by figureCitations',

    // single word name of the table
    name: 'images_figureCitations',
    
    // Name of the database, also used as the name of the 
    // file on disk with '.sqlite' extension.
    // Name of the schema, if ATTACHED as a separate database
    database: {
        name: 'zenodeo',
        schema: 'main'
    },
    
    summary: 'A cross-table between images and figureCitations',
    description: "A cross-table for many-to-many relationships between images and figureCitations",
    
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