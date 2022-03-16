'use strict'

module.exports = [
    {
        name: 'treatmentCitationId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the treatmentCitation. Has to be a 32 character string like: 'EC3D4B08FFADFFCE66FAFA5E334CFA00'`,
            isResourceId: true
        },
        sqltype: 'TEXT NOT NULL UNIQUE',
        cheerio: '$("treatmentCitation").attr("id")'
    },

    {
        name: 'treatmentId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the parent treatment (FK). Has to be a 32 character string like: '000587EFFFADFFC267F7FAC4351CFBC7'`
        },
        sqltype: 'TEXT NOT NULL'
    },

    {
        name: 'treatmentCitation',
        schema: { 
            type: 'string',
            description: `The taxonomic name and the author of the species, plus the author of the treatment being cited. Can use the following syntax:
- treatmentCitation=Lepadichthys erythraeus :  Dor 1984 : 54 Dor, 1984
- treatmentCitation=starts_with(Lepadichthys)
- treatmentCitation=ends_with(1984)
- treatmentCitation=contains(erythraeus)
  **Note:** queries involving inexact matches will be considerably slow`
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=reference_group] treatmentCitationGroup taxonomicName").text() + " " + $("subSubSection[type=reference_Group] treatmentCitationGroup taxonomicName").attr("authority") + " sec. " + $("subSubSection[type=reference_Group] treatmentCitationGroup bibRefCitation").text()',
        defaultOp: 'starts_with'
    },

    {
        name: 'refString',
        schema: { 
            type: 'string',
            description: `The bibliographic reference string of the treatments cited by this treatment. Can use the following syntax:
- refString=Dor, M. (1984) CLOFRES. Checklist of fishes of the Red Sea. The Israeli Academy of Sciences and Humanities, Jerusalem, xxii + 437 pp.
- refString=starts_with(Dor, M)
- refString=ends_with(Jerusalem, xxii + 437 pp.)
- refString=contains(Checklist of fishes)
  **Note:** queries involving inexact matches will be considerably slow`
        },
        sqltype: 'TEXT',
        cheerio: '$("subSubSection[type=referenceGroup] treatmentCitationGroup treatmentCitation bibRefCitation").attr("refString")',
        defaultOp: 'starts_with'
    }
]