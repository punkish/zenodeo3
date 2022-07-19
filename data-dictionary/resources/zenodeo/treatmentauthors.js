'use strict';

/***********************************************************************
 * 
 * Data dictionary for treatmentAuthors from Zenodeo
 * 
 **********************************************************************/

module.exports = {
    cache: true,
    fields: [
        {
            name: 'treatmentAuthorId',
            schema: {
                type: 'string', 
                maxLength: 32, 
                minLength: 32,
                description: `The unique ID of the treatmentAuthor. Has to be a 32 character string like: 'EC3D4B08FFADFFCE66FAFA5E334CFA00'`,
            },
            isResourceId: true,
            sqltype: 'TEXT NOT NULL UNIQUE',
            cheerio: '$("treatmentAuthor").attr("id")'
        },
        {
            name     : 'treatmentAuthor',
            schema: { 
                type: 'string',
                description: `The author of this treatment (author of the article is used if no treatment authority is found)`
            },
            sqlType       : 'TEXT',
            cheerio: 'mods\\\\:namePart',
            defaultOp: 'starts_with'
        }
    ]
};