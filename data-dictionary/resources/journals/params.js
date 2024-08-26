import * as utils from '../../../lib/utils.js';
import { journalsByYears } from '../journalsByYears/index.js';

const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the class',
        },
        isResourceId: true
    },
    {
        name: 'journalTitle',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- \`journalTitle=Biodiversity Data Journal 4\`
- \`journalTitle=starts_with(Biodiversity)\`
- \`journalTitle=ends_with(Journal 4)\`
- \`journalTitle=contains(Data Journal)\`
- \`journalTitle=not_like(Data Journal)\`
  **Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            desc: 'The journal in which the treatment was published',
            type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
        },
        cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:titleInfo mods\\\\:title").text()',
        defaultOp: 'starts_with',
        facet: 'count > 100'
    }
];

const externalParams = [

    // journalsByYears
    {
        dict: journalsByYears,
        cols: [
            {
                name: 'journalYear',
                joins: [
                    'JOIN journalsByYears ON journals.id = journalsByYears.journals_id'
                ]
            },
            {
                name: 'num',
                joins: [
                    'JOIN journalsByYears ON journals.id = journalsByYears.journals_id'
                ]
            }
        ]
    }
];

const allNewParams = utils.addExternalParams(externalParams);
params.push(...allNewParams);

export { params }