import { Config } from '@punkish/zconfig';
const config = new Config().settings;

export const params = [
    {
        name: 'treatmentCitationId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the treatmentCitation. Has to be a 32 character string like: 'EC3D4B08FFADFFCE66FAFA5E334CFA00'`,
        },
        sql: {
            desc: 'The unique resourceId of the treatmentCitation',
            type: 'TEXT UNIQUE NOT NULL PRIMARY KEY CHECK(Length(treatmentCitationId) = 32)'
        },
        isResourceId: true,
        cheerio: '$("treatmentCitation").attr("id")'
    },
    {
        name: 'treatments_id',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            desc: 'The ID of the parent treatment (FK)',
            type: 'INTEGER NOT NULL REFERENCES treatments(id)'
        }
    },
    {
        name: 'bibRefCitations_id',
        schema: { 
            type: 'integer', 
            description: ''
        },
        sql: {
            desc: 'The ID of the related bibRefCitation (FK)',
            type: 'INTEGER REFERENCES bibRefCitations(id)'
        }
    },
    {
        name: 'treatmentCitation',
        schema: { 
            type: 'string',
            description: `Can use the following syntax:
- treatmentCitation=Lepadichthys erythraeus :  Dor 1984 : 54 Dor, 1984
- treatmentCitation=starts_with(Lepadichthys)
- treatmentCitation=ends_with(1984)
- treatmentCitation=contains(erythraeus)
  **Note:** queries involving inexact matches will be considerably slow`
        },
        sql: {
            desc: 'The taxonomic name and the author of the species, plus the author of the treatment being cited',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("subSubSection[type=reference_group] treatmentCitationGroup taxonomicName").text() + " " + $("subSubSection[type=reference_Group] treatmentCitationGroup taxonomicName").attr("authority") + " sec. " + $("subSubSection[type=reference_Group] treatmentCitationGroup bibRefCitation").text()',
        defaultOp: 'starts_with'
    },
    {
        name: 'refString',
        schema: { 
            type: 'string',
            description: `Can use the following syntax:
- refString=Dor, M. (1984) CLOFRES. Checklist of fishes of the Red Sea. The Israeli Academy of Sciences and Humanities, Jerusalem, xxii + 437 pp.
- refString=starts_with(Dor, M)
- refString=ends_with(Jerusalem, xxii + 437 pp.)
- refString=contains(Checklist of fishes)
  **Note:** queries involving inexact matches will be considerably slow`
        },
        sql: {
            desc: 'The bibliographic reference string of the treatments cited by this treatment',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("subSubSection[type=referenceGroup] treatmentCitationGroup treatmentCitation bibRefCitation").attr("refString")',
        defaultOp: 'starts_with',
    }
]