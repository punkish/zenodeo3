export const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        }
    },
    {
        name: 'collectionCode',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- \`collectionCode=USNM\`
- \`collectionCode=starts_with(US)\`
**Note:** queries involving inexact matches will be considerably slow`,
        },
        isResourceId: true,
        sql: {
            type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE',
            desc: 'The collection code for a natural history collection'
        },
        cheerio: '$("collectionCode").attr("collectionCode")'
    },
    {
        name: 'country',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- \`country=Netherlands\`
- \`country=starts_with(Uni)\`
**Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            type: 'TEXT COLLATE NOCASE',
            desc: 'The country of the collection'
        },
        cheerio: '$("collectionCode").attr("country")'
    },
    {
        name: 'name',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- \`name=Royal Botanic Gardens\`
- \`name=starts_with(Royal)\`
**Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            type: 'TEXT COLLATE NOCASE',
            desc: 'The name of the collection'
        },
        cheerio: '$("collectionCode").attr("name")'
    },
    {
        name: 'httpUri',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- \`httpUri=http://grbio.org/cool/91g3-0mnw\`
**Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            type: 'TEXT COLLATE NOCASE',
            desc: 'The URI of the collection'
        },
        cheerio: '$("collectionCode").attr("httpUri")'
    },
    {
        name: 'lsid',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- \`lsid=urn:lsid:biocol.org:col:15867\``,
        },
        sql: {
            type: 'TEXT COLLATE NOCASE',
            desc: 'The LSID of the collection'
        },
        cheerio: '$("collectionCode").attr("lsid")'
    },
    {
        name: 'type',
        schema: {
            type: 'string',
            description: `Can use the following syntax:
- \`type=Herbarium\`
- \`type=starts_with(Herb)\`
**Note:** queries involving inexact matches will be considerably slow`,
        },
        sql: {
            type: 'TEXT COLLATE NOCASE',
            desc: 'The type of the collection'
        },
        cheerio: '$("collectionCode").attr("type")'
    }
]