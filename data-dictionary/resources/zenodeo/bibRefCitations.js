import * as utils from '../../../lib/utils.js';

// <bibRefCitation id="75ECFE935FC03D66BBD3D34DB28684E7" author="Hinojosa-Diaz, I A" journalOrPublisher="Journal of Hymenoptera Research" pageId="0" pageNumber="6733" pagination="69 - 77" title="The North American Invasion of the Giant Resin Bee (Hymenoptera: Megachilidae)" volume="14" year="2005">

// <bibRefCitation id="EC3F4B6FD744DE1FEC5E890BFAA7DE58" pageId="3" pageNumber="128" refId="ref7020" refString="Crews, S. C. &amp; Gillespie, R. G. (2010) Molecular systematics of Selenops spiders (Araneae: Selenopidae) from North and Central America: Implications for Caribbean biogeography. Biological Journal of the Linnean Society, 101, 288 - 322. https: // doi. org / 10.1111 / j. 1095 - 8312.2010.01494. x" type="journal article">CrEws &amp; GIllEspIE 2010</bibRefCitation>

export const dictionary = [
    {
        name: 'bibRefCitationId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the bibRefCitation. Has to be a 32 character string like: 'EC384B11E320FF95FB78F995FEA0F964'`,
        },
        isResourceId: true,
        sqltype: 'TEXT NOT NULL UNIQUE',
        cheerio: '$("bibRefCitation").attr("id")'
    },

    {
        name: 'treatmentId',
        schema: { 
            type: 'string', 
            maxLength: 32, 
            minLength: 32,
            description: `The unique ID of the parent treatment (FK). Has to be a 32 character string like: '000087F6E320FF99FDC9FA73FA90FABE'`
        },
        sqltype: 'TEXT NOT NULL'
    },

    {
        name: 'author',
        schema: {
            type: 'string',
            description: `The author`
        },
        sqltype: 'TEXT',
        cheerio: '$("bibRefCitation").attr("author")'
    },

    {
        name: 'journalOrPublisher',
        schema: {
            type: 'string',
            description: `The journal or publisher`
        },
        sqltype: 'TEXT',
        cheerio: '$("bibRefCitation").attr("journalOrPublisher")'
    },

    {
        name: 'title',
        schema: {
            type: 'string',
            description: `The title of the citation`
        },
        sqltype: 'TEXT',
        cheerio: '$("bibRefCitation").attr("title")'
    },

    {
        name: 'refString',
        schema: {
            type: 'string',
            description: `The full text of the reference cited by the treatment`
        },
        sqltype: 'TEXT',
        cheerio: '$("bibRefCitation").attr("refString")'
    },

    {
        name: 'bibRefType',
        schema: {
            type: 'string',
            description: 'The type of reference cited by the treatment'
        },
        sqltype: 'TEXT',
        cheerio: '$("bibRefCitation").attr("type")',
        facets: true
    },

    {
        name: 'year',
        schema: {
            type: 'string',
            pattern: utils.re.year,
            description: 'The year of the reference cited by this treatment'
        },
        sqltype: 'TEXT',
        cheerio: '$("bibRefCitation").attr("year")',
        facets: true
    },

    {
        name: 'innerText',
        schema: {
            type: 'string',
            description: 'xml'
        },
        sqltype: 'TEXT',
        cheerio: '$("bibRefCitation")',
        notQueryable: true
    },

        {
        name: 'q',
        alias: {
            select: "snippet(vbibrefcitations, 1, '<b>', '</b>', '…', 25) snippet",
            where : 'vbibrefcitations'
        },
        schema: {
            type: 'string',
            description: `A snippet extracted from the full text of the reference cited by the treatment. Can use the following syntax: 
- \`q=spiders\``
        },
        sqltype: 'TEXT',
        zqltype: 'expression',
        notDefaultCol: true,
        defaultOp: 'match',
        joins: {
            select: null,
            where : [ 'JOIN vbibrefcitations ON bibRefCitations.bibRefCitationId = vbibrefcitations.bibRefCitationId' ]
        }
    }
]