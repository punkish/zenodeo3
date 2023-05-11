import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const etlStats = {
    title: 'ETL Stats',
    name: 'etlStats',
    database: 'main',
    summary: 'Stats for the extract-transform-load process',
    description: "…",
    tableType: 'TABLE',
    tableExt: '',
    tableQualifier: '',
    tableSource: '',
    params,
    triggers,
    inserts,
    source: 'zenodeo',
    tags: [ 'zenodeo' ]
}