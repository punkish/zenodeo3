import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const binomens = {

    // descriptive title of the datastore
    title: 'Binomen view',

    // single word name of the table
    name: 'binomen_view',
    
    // Name of the database, also used as the name of the 
    // file on disk with '.sqlite' extension.
    // Name of the schema, if ATTACHED as a separate database
    database: {
        name: 'zenodeo',
        schema: 'main'
    },

    summary: 'Species binomens',
    description: "…",
    
    // TABLE | VIEW | VIRTUAL TABLE
    tableType: 'VIEW',

    // SQLite extension used to make a virtual table
    sqliteExtension: '',

    // view source if tableType is VIEW
    viewSource: `
SELECT
    DISTINCT genus || ' ' || species AS binomen
FROM
    treatments 
    JOIN genera ON genera_id = genera.id
    JOIN species ON species_id = species.id
WHERE
    rank = 'species' 
    AND summary IS NOT NULL 
    AND genera_id IS NOT NULL
    AND genera_id != 18 
    AND species_id IS NOT NULL
    AND species_id != 2
ORDER BY
    binomen ASC`,

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