import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const treatmentAuthors = {

    // descriptive title of the datastore
    title: 'Treatment Authors',

    // single word name of the table
    name: 'treatmentAuthors',
    
    // Name of the database, also used as the name of the 
    // file on disk with '.sqlite' extension.
    // Name of the schema, if ATTACHED as a separate database
    database: {
        name: 'zenodeo',
        schema: 'main'
    },

    summary: 'Fetches treatment authors',
    description: "A reference to or citation of one, a part of, or multiple specimens in scholarly publications. For example, a citation of a physical specimen from a scientific collection in a taxonomic treatment in a scientific publication; a citation of a group of physical specimens, such as paratypes in a taxonomic treatment in a scientific publication; or an occurrence mentioned in a field note book.",
    
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