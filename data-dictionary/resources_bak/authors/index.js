import { triggers } from './triggers.js';
import { inserts } from './inserts.js';
import { params } from './params.js';

export const archives = {
    title: 'Authors',
    name: 'authors',
    database: 'main',
    summary: 'Authors of articles',
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