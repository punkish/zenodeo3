import tap from 'tap';
import * as funcsToTest from './resourceUtils.js';

const testGroups = {
    getParams: [
        {
            input: ['images'],
            wanted: [
                {
                  name: 'id',
                  sql: { type: 'INTEGER PRIMARY KEY', desc: 'PK' },
                  schema: { type: 'integer', description: 'The unique ID of the image' },
                  isResourceId: true,
                  selname: 'images.id',
                  where: 'images.id',
                  defaultOp: '='
                },
                {
                  name: 'httpUri',
                  schema: {
                    type: 'string',
                    description: 'Can use the following syntax: \n- `httpUri=eq(http://example.com)`'
                  },
                  sql: { type: 'TEXT NOT NULL UNIQUE', desc: 'The URI of the image. ' },
                  selname: 'images.httpUri',
                  where: 'images.httpUri',
                  defaultOp: '='
                },
                {
                  name: 'figureDoi',
                  schema: {
                    type: 'string',
                    description: 'Can use the following syntax: \n' +
                      '- `figureDoi=eq(http://doi.org/10.5281/zenodo.3850863)`'
                  },
                  sql: {
                    desc: 'The DOI of the image cleaned up',
                    type: 'TEXT GENERATED ALWAYS AS (\n' +
                      '                Iif(\n' +
                      "                    Instr(figureDoiOriginal, '/10.'), \n" +
                      '                    Substr(\n' +
                      '                        figureDoiOriginal, \n' +
                      "                        Instr(figureDoiOriginal, '/10.') + 1\n" +
                      '                    ), \n' +
                      '                    figureDoiOriginal\n' +
                      '                ) \n' +
                      '            ) STORED'
                  },
                  cheerio: '$("figureCitation").attr("figureDoi")',
                  selname: 'images.figureDoi',
                  where: 'images.figureDoi',
                  defaultOp: '='
                },
                {
                  name: 'caption',
                  selname: 'images.captionText',
                  where: 'images.captionText',
                  schema: {
                    type: 'string',
                    description: 'A snippet extracted from the caption of the image. Can use the following syntax: \n' +
                      '- `caption=starts_with(spiders)`'
                  },
                  sql: {
                    desc: 'The text of the figure cited by this treatment',
                    type: 'TEXT COLLATE NOCASE'
                  },
                  cheerio: '$("figureCitation").attr("captionText")',
                  defaultOp: '='
                },
                {
                  name: 'treatments_id',
                  schema: { type: 'integer', description: '' },
                  sql: {
                    desc: 'The FK of the parent treatment',
                    type: 'INTEGER NOT NULL REFERENCES treatments(id)'
                  },
                  selname: 'images.treatments_id',
                  where: 'images.treatments_id',
                  defaultOp: '='
                },
                {
                  name: 'captionText',
                  schema: {
                    type: 'string',
                    description: 'A snippet extracted from the caption of the image. Can use the following syntax: \n' +
                      '- `q=spiders`'
                  },
                  defaultOp: 'match',
                  sql: {},
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'imagesFts.captionText',
                  where: 'imagesFts.captionText',
                  joins: [ 'JOIN imagesFts ON images.id = imagesFts.rowid' ],
                  isResourceId: false,
                  defaultCol: false
                },
                {
                  name: 'q',
                  selname: `snippet(treatmentsFts, 0, '<span class="match">', '</span>', '…', 25) AS snippet`,
                  where: 'treatmentsFts.fulltext',
                  schema: {
                    type: 'string',
                    description: 'A snippet extracted from the full text of the treatment. Can use the following syntax: \n' +
                      '- `q=spiders`'
                  },
                  defaultOp: 'match',
                  defaultCol: false,
                  external: true,
                  externalTable: '',
                  fk: false,
                  joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid'
                  ],
                  isResourceId: false
                },
                {
                  name: 'treatmentId',
                  schema: {
                    type: 'string',
                    maxLength: 32,
                    minLength: 32,
                    description: 'Has to be a 32 character string:\n' +
                      '- `treatmentId=388D179E0D564775C3925A5B93C1C407`'
                  },
                  sql: {
                    desc: 'The unique resourceId of the treatment',
                    type: 'TEXT UNIQUE NOT NULL CHECK(Length(treatmentId) = 32)'
                  },
                  cheerio: '$("document").attr("docId")',
                  isResourceId: false,
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'treatments.treatmentId',
                  where: 'treatments.treatmentId',
                  joins: [ 'JOIN treatments ON images.treatments_id = treatments.id' ],
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'treatmentTitle',
                  schema: {
                    type: 'string',
                    description: 'Can use the following syntax:\n' +
                      '- `treatmentTitle=Ichneumonoidea (Homolobus) Foerster 1863`\n' +
                      '- `treatmentTitle=eq(Ichneumonoidea (Homolobus) Foerster 1863)`\n' +
                      '- `treatmentTitle=starts_with(Ichneumonoidea)`\n' +
                      '- `treatmentTitle=ends_with(Foerster 1863)`\n' +
                      '- `treatmentTitle=contains(Homolobus)`\n' +
                      '\n' +
                      "  **Note 1:** the first two options above (='…' and =eq(…)) are the same\n" +
                      '  **Note 2:** queries involving inexact matches will be considerably slow'
                  },
                  sql: { desc: 'Title of the treatment', type: 'TEXT COLLATE NOCASE' },
                  cheerio: '$("document").attr("docTitle")',
                  defaultOp: 'starts_with',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'treatments.treatmentTitle',
                  where: 'treatments.treatmentTitle',
                  joins: [ 'JOIN treatments ON images.treatments_id = treatments.id' ],
                  isResourceId: false,
                  defaultCol: false
                },
                {
                  name: 'treatmentDOI',
                  schema: {
                    type: 'string',
                    description: 'For example:\n- `doi=10.5281/zenodo.275008`'
                  },
                  sql: {
                    desc: 'DOI of the treatment cleaned up',
                    type: 'TEXT GENERATED ALWAYS AS (\n' +
                      '                Iif(\n' +
                      "                    Instr(treatmentDOIorig, '/10.'), \n" +
                      '                    Substr(\n' +
                      '                        treatmentDOIorig, \n' +
                      "                        Instr(treatmentDOIorig, '/10.') + 1\n" +
                      '                    ), \n' +
                      '                    treatmentDOIorig\n' +
                      '                ) \n' +
                      '            ) STORED'
                  },
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'treatments.treatmentDOI',
                  where: 'treatments.treatmentDOI',
                  joins: [ 'JOIN treatments ON images.treatments_id = treatments.id' ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'zenodoDep',
                  schema: { type: 'integer', description: '' },
                  sql: { desc: 'Zenodo deposition number', type: 'INTEGER' },
                  cheerio: '$("document").attr("ID-Zenodo-Dep")',
                  queryable: false,
                  indexed: false,
                  defaultOp: 'eq',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'treatments.zenodoDep',
                  where: 'treatments.zenodoDep',
                  joins: [ 'JOIN treatments ON images.treatments_id = treatments.id' ],
                  isResourceId: false,
                  defaultCol: false
                },
                {
                  name: 'articleDOI',
                  schema: {
                    type: 'string',
                    description: 'For example:\n- `doi=10.3897/BDJ.4.e8151`'
                  },
                  sql: {
                    desc: 'DOI of journal article cleaned up',
                    type: 'TEXT GENERATED ALWAYS AS (\n' +
                      '                Iif(\n' +
                      "                    Instr(articleDOIorig, '/10.'), \n" +
                      '                    Substr(\n' +
                      '                        articleDOIorig, \n' +
                      "                        Instr(articleDOIorig, '/10.') + 1\n" +
                      '                    ), \n' +
                      '                    articleDOIorig\n' +
                      '                ) \n' +
                      '            ) STORED'
                  },
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'treatments.articleDOI',
                  where: 'treatments.articleDOI',
                  joins: [ 'JOIN treatments ON images.treatments_id = treatments.id' ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'articleTitle',
                  schema: {
                    type: 'string',
                    description: 'Can use the following syntax:\n' +
                      '- `articleTitle=Checklist of British and Irish Hymenoptera - Braconidae`\n' +
                      '- `articleTitle=eq(Checklist of British and Irish Hymenoptera - Braconidae)`\n' +
                      '- `articleTitle=starts_with(Checklist)`\n' +
                      '- `articleTitle=ends_with(Braconidae)`\n' +
                      '- `articleTitle=contains(British and Irish)`\n' +
                      '\n' +
                      "  **Note 1:** the first two options above (='…' and =eq(…)) are the same\n" +
                      '  **Note 2:** queries involving inexact matches will be considerably slow'
                  },
                  sql: {
                    desc: 'The article in which the treatment was published',
                    type: 'TEXT COLLATE NOCASE'
                  },
                  cheerio: '$("document").attr("masterDocTitle")',
                  defaultOp: 'starts_with',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'treatments.articleTitle',
                  where: 'treatments.articleTitle',
                  joins: [ 'JOIN treatments ON images.treatments_id = treatments.id' ],
                  isResourceId: false,
                  defaultCol: false
                },
                {
                  name: 'articleAuthor',
                  schema: {
                    type: 'string',
                    description: 'Unless there is a nomenclature act, this is also the author of the treatment (there only is a nomenclature act if there is a taxonomicNameLabel in the "nomenclature" subSubSection, in which case the treatment authors are to be taken from the authorityName attribute of the first taxonomicName in the "nomenclature" subSubSection … and if said attribute is absent, the treatment author defaults to this field). Can use the following syntax:\n' +
                      '- `articleAuthor=Kronestedt, Torbjörn &amp; Marusik, Yuri M.`\n' +
                      '- `articleAuthor=eq(Kronestedt, Torbjörn &amp; Marusik, Yuri M.)`\n' +
                      '- `articleAuthor=starts_with(Kronestedt)`\n' +
                      '- `articleAuthor=ends_with(Yuri M.)`\n' +
                      '- `articleAuthor=contains(Torbjörn)`\n' +
                      '\n' +
                      "  **Note 1:** the first two options above (='…' and =eq(…)) are the same\n" +
                      '  **Note 2:** queries involving inexact matches will be considerably slow'
                  },
                  sql: {
                    desc: 'The author of the article in which the treatment was published',
                    type: 'TEXT COLLATE NOCASE'
                  },
                  cheerio: '$("document").attr("docAuthor")',
                  defaultOp: 'starts_with',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'treatments.articleAuthor',
                  where: 'treatments.articleAuthor',
                  joins: [ 'JOIN treatments ON images.treatments_id = treatments.id' ],
                  isResourceId: false,
                  defaultCol: false
                },
                {
                  name: 'authorityName',
                  schema: {
                    type: 'string',
                    description: 'Not necessarily the same as the authors of the journal article, but omitted if same as article authors. Can use the following syntax:\n' +
                      '- `authorityName=Foerster`\n' +
                      '- `authorityName=eq(Foerster)`\n' +
                      '- `authorityName=starts_with(Foe)`\n' +
                      '- `authorityName=ends_with(ster)`\n' +
                      '- `authorityName=contains(erst)`\n' +
                      '\n' +
                      "  **Note 1:** the first two options above (='…' and =eq(…)) are the same\n" +
                      '  **Note 2:** queries involving inexact matches will be considerably slow'
                  },
                  sql: {
                    desc: 'The author(s) of the treatment',
                    type: 'TEXT COLLATE NOCASE'
                  },
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("authorityName")',
                  defaultOp: 'starts_with',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'treatments.authorityName',
                  where: 'treatments.authorityName',
                  joins: [ 'JOIN treatments ON images.treatments_id = treatments.id' ],
                  isResourceId: false,
                  defaultCol: false
                },
                {
                  name: 'status',
                  schema: {
                    type: 'string',
                    description: 'Can be new species, or new combination, or new combination and new synonym'
                  },
                  sql: {
                    desc: 'The descriptor for the taxonomic status proposed by a given treatment',
                    type: 'TEXT COLLATE NOCASE'
                  },
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("status")',
                  facet: 'count > 1',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'treatments.status',
                  where: 'treatments.status',
                  joins: [ 'JOIN treatments ON images.treatments_id = treatments.id' ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'journalTitle',
                  schema: {
                    type: 'string',
                    description: 'Can use the following syntax:\n' +
                      '- `journalTitle=Biodiversity Data Journal 4`\n' +
                      '- `journalTitle=starts_with(Biodiversity)`\n' +
                      '- `journalTitle=ends_with(Journal 4)`\n' +
                      '- `journalTitle=contains(Data Journal)`\n' +
                      '- `journalTitle=not_like(Data Journal)`\n' +
                      '  **Note:** queries involving inexact matches will be considerably slow'
                  },
                  sql: {
                    desc: 'The journal in which the treatment was published',
                    type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
                  },
                  cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:titleInfo mods\\\\:title").text()',
                  defaultOp: 'starts_with',
                  facet: 'count > 100',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'journals.journalTitle',
                  where: 'journals.journalTitle',
                  joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN journals ON treatments.journals_id = journals.id'
                  ],
                  isResourceId: false,
                  defaultCol: false
                },
                {
                  name: 'journalYear',
                  schema: { type: 'integer', description: '' },
                  sql: { desc: 'The year of the journal', type: 'INTEGER' },
                  zqltype: 'datetime',
                  cheerio: '$("mods\\\\:relatedItem[type=host] mods\\\\:part mods\\\\:date").text()',
                  facet: 'count > 1',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'treatments.journalYear',
                  where: 'treatments.journalYear',
                  joins: [ 'JOIN treatments ON images.treatments_id = treatments.id' ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'publicationDate',
                  alias: 'publicationDateOrig',
                  schema: {
                    type: 'string',
                    pattern: undefined,
                    description: 'Can use the following syntax: \n' +
                      '- `publicationDate=eq(2018-1-12)`\n' +
                      '- `publicationDate=since(2018-12-03)`\n' +
                      '- `publicationDate=until(2018-03-22)`\n' +
                      '- `publicationDate=between(2018-03-22 and 2019-12-03)`\n' +
                      '\n' +
                      '  **Note:** Date is made of yyyy-m?-d?\n' +
                      '- yyyy: a four digit year\n' +
                      '- m?: one or two digit month\n' +
                      '- d?: one or two digit day'
                  },
                  sql: { desc: 'The publication date of the treatment', type: 'TEXT' },
                  zqltype: 'datetime',
                  cheerio: '$("mods\\\\:detail[type=pubDate] mods\\\\:number").text()',
                  defaultOp: 'eq',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'treatments.publicationDate',
                  where: 'treatments.publicationDate',
                  joins: [ 'JOIN treatments ON images.treatments_id = treatments.id' ],
                  isResourceId: false,
                  defaultCol: false
                },
                {
                  name: 'kingdom',
                  schema: { type: 'string', description: 'The name of the kingdom' },
                  sql: {
                    desc: 'The higher category of the taxonomicName',
                    type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
                  },
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("kingdom")',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'kingdoms.kingdom',
                  where: 'kingdoms.kingdom',
                  joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN kingdoms ON treatments.kingdoms_id = kingdoms.id'
                  ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'phylum',
                  schema: { type: 'string', description: 'The name of the phylum' },
                  sql: {
                    desc: 'The higher category of the taxonomicName',
                    type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
                  },
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("phylum")',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'phyla.phylum',
                  where: 'phyla.phylum',
                  joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN phyla ON treatments.phyla_id = phyla.id'
                  ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'class',
                  schema: { type: 'string', description: '' },
                  sql: {
                    desc: 'The higher category of the taxonomicName',
                    type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
                  },
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("class")',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'classes.class',
                  where: 'classes.class',
                  joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN classes ON treatments.classes_id = classes.id'
                  ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'family',
                  schema: { type: 'string', description: 'The name of the family' },
                  sql: {
                    desc: 'The higher category of the taxonomicName',
                    type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
                  },
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("family")',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'families.family',
                  where: 'families.family',
                  joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN families ON treatments.families_id = families.id'
                  ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'order',
                  selname: 'orders."order"',
                  where: 'orders."order"',
                  schema: { type: 'string', description: 'The name of the order' },
                  sql: {
                    desc: 'The higher category of the taxonomicName',
                    type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
                  },
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("order")',
                  external: true,
                  externalTable: '',
                  fk: false,
                  joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN orders ON treatments.orders_id = orders.id'
                  ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'genus',
                  schema: { type: 'string', description: 'The name of the genus' },
                  sql: {
                    desc: 'The higher category of the taxonomicName',
                    type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
                  },
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("genus")',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'genera.genus',
                  where: 'genera.genus',
                  joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN genera ON treatments.genera_id = genera.id'
                  ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'species',
                  schema: { type: 'string', description: 'The name of the species' },
                  sql: {
                    desc: 'The higher category of the taxonomicName',
                    type: 'TEXT UNIQUE NOT NULL COLLATE NOCASE'
                  },
                  cheerio: '$("subSubSection[type=nomenclature] taxonomicName").attr("species")',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'species.species',
                  where: 'species.species',
                  joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN species ON treatments.species_id = species.id'
                  ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'checkinTime',
                  schema: {
                    type: 'string',
                    pattern: undefined,
                    description: 'Can use the following syntax: \n' +
                      '- `checkinTime=eq(2018-1-12)`\n' +
                      '- `checkinTime=since(2018-12-03)`\n' +
                      '- `checkinTime=until(2018-03-22)`\n' +
                      '- `checkinTime=between(2018-03-22 and 2019-12-03)`\n' +
                      '\n' +
                      '  **Note1:** Date is made of yyyy-m?-d?\n' +
                      '- yyyy: a four digit year\n' +
                      '- m?: one or two digit month\n' +
                      '- d?: one or two digit day\n' +
                      '\n' +
                      '    **Note2:** Even though this field is called "checkinTime", for now it can be queried only for dates.'
                  },
                  sql: {
                    desc: 'The time when the article was first uploaded into the system (stored as ms since unixepoch)',
                    type: 'INTEGER'
                  },
                  zqltype: 'datetime',
                  cheerio: '$("document").attr("checkinTime")',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'treatments.checkinTime',
                  where: 'treatments.checkinTime',
                  joins: [ 'JOIN treatments ON images.treatments_id = treatments.id' ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'latitude',
                  schema: { type: 'number', minimum: -90, maximum: 90, description: '' },
                  sql: { desc: 'The geolocation of the treatment', type: 'REAL' },
                  cheerio: '$("materialsCitation").attr("latitude")',
                  defaultCol: false,
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'materialCitations.latitude',
                  where: 'materialCitations.latitude',
                  joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id'
                  ],
                  isResourceId: false,
                  defaultOp: '='
                },
                {
                  name: 'longitude',
                  schema: { type: 'number', minimum: -180, maximum: 180, description: '' },
                  sql: { desc: 'The geolocation of the treatment', type: 'REAL' },
                  cheerio: '$("materialsCitation").attr("longitude")',
                  defaultCol: false,
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'materialCitations.longitude',
                  where: 'materialCitations.longitude',
                  joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id'
                  ],
                  isResourceId: false,
                  defaultOp: '='
                },
                {
                  name: 'geolocation',
                  schema: {
                    type: 'string',
                    pattern: `(?<operator>within)\\((radius:\\s*(?<radius>[0-9]+),\\s*units:\\s*['"](?<units>kilometers|miles)['"],\\s*lat:\\s*(?<lat>([+-]?([0-9]+)(.[0-9]+)?)),\\s*lng:\\s*(?<lng>([+-]?([0-9]+)(.[0-9]+)?))|min_lat:\\s*(?<min_lat>([+-]?([0-9]+)(.[0-9]+)?)),min_lng:\\s*(?<min_lng>([+-]?([0-9]+)(.[0-9]+)?)),max_lat:\\s*(?<max_lat>([+-]?([0-9]+)(.[0-9]+)?)),max_lng:\\s*(?<max_lng>([+-]?([0-9]+)(.[0-9]+)?)))\\)`,
                    description: 'The geolocation of the treatment. Can use the following syntax:\n' +
                      "- `geolocation=within(radius:10, units: 'kilometers', lat:40.00, lng: -120)`\n" +
                      '- `geolocation=contained_in(lower_left:{lat: -40.00, lng: -120},upper_right: {lat:23,lng:6.564})`\n'
                  },
                  joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id',
                    'JOIN materialCitationsRtree ON materialCitations.id = materialCitationsRtree.materialCitations_id'
                  ],
                  zqltype: 'geolocation',
                  defaultCol: false,
                  indexed: false,
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'materialCitations.geolocation',
                  where: 'materialCitations.geolocation',
                  isResourceId: false,
                  defaultOp: '='
                },
                {
                  name: 'isOnLand',
                  schema: { type: 'boolean', description: '' },
                  sql: {
                    desc: '1 (true) if treatment is on land',
                    type: 'INTEGER DEFAULT NULL'
                  },
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'materialCitations.isOnLand',
                  where: 'materialCitations.isOnLand',
                  joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id'
                  ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'validGeo',
                  schema: { type: 'boolean', description: '' },
                  sql: {
                    desc: '1 (true) if treatment has a valid geolocation',
                    type: 'BOOLEAN GENERATED ALWAYS AS (\n' +
                      "                typeof(latitude) = 'real' AND \n" +
                      '                abs(latitude) < 90 AND \n' +
                      "                typeof(longitude) = 'real' AND \n" +
                      '                abs(longitude) <= 180\n' +
                      '            ) STORED'
                  },
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'materialCitations.validGeo',
                  where: 'materialCitations.validGeo',
                  joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id'
                  ],
                  isResourceId: false,
                  defaultCol: false,
                  defaultOp: '='
                },
                {
                  name: 'eco_name',
                  schema: { type: 'string', description: '' },
                  sql: { type: 'TEXT', desc: 'name of the ecoregions' },
                  defaultOp: 'starts_with',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'ecoregions.eco_name',
                  where: 'ecoregions.eco_name',
                  joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id',
                    'JOIN geodata.ecoregions ON materialCitations.ecoregions_id = geodata.ecoregions.id'
                  ],
                  isResourceId: false,
                  defaultCol: false
                },
                {
                  name: 'biome',
                  selname: 'biome_synonyms.biome_synonym',
                  where: 'biome_synonyms.biome_synonym',
                  schema: { type: 'string', description: '' },
                  sql: { type: 'TEXT', desc: 'name of the biome' },
                  joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id',
                    'JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id'
                  ],
                  defaultOp: 'starts_with',
                  external: true,
                  externalTable: '',
                  fk: false,
                  isResourceId: false,
                  defaultCol: false
                },
                {
                  name: 'realm',
                  schema: { type: 'string', description: '' },
                  sql: { type: 'TEXT', desc: 'name of the realm' },
                  defaultOp: 'starts_with',
                  external: true,
                  externalTable: '',
                  fk: false,
                  selname: 'realms.realm',
                  where: 'realms.realm',
                  joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id',
                    'JOIN geodata.realms ON materialCitations.realms_id = geodata.realms.realms_id'
                  ],
                  isResourceId: false,
                  defaultCol: false
                },
                {
                  name: 'refreshCache',
                  schema: {
                    type: 'boolean',
                    description: 'Force refresh cache (true | false)',
                    default: false
                  },
                  defaultCol: false
                },
                {
                  name: 'cacheDuration',
                  schema: { type: 'integer', description: 'number of days', default: 7 },
                  defaultCol: false
                },
                {
                  name: 'facets',
                  schema: {
                    type: 'boolean',
                    description: 'Calculate facets (true | false)',
                    default: false
                  },
                  defaultCol: false
                },
                {
                  name: 'relatedRecords',
                  schema: {
                    type: 'boolean',
                    description: 'Calculate related records (true | false)',
                    default: false
                  },
                  defaultCol: false
                },
                {
                  name: 'stats',
                  schema: {
                    type: 'boolean',
                    description: 'Calculate statistics for dashboard (true | false)',
                    default: false
                  },
                  defaultCol: false
                },
                {
                  name: 'termFreq',
                  schema: { type: 'boolean', description: '', default: false },
                  defaultCol: false
                },
                {
                  name: 'yearlyCounts',
                  schema: { type: 'boolean', description: '', default: false },
                  defaultCol: false
                },
                {
                  name: 'page',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Starting page. Has to be an integer greater than 0. Defaults to 1',
                    default: 1
                  },
                  defaultCol: false
                },
                {
                  name: 'size',
                  schema: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Number of records to fetch per page. Has to be an integer between 1 and 100. Defaults to 30',
                    default: 30
                  },
                  defaultCol: false
                },
                {
                  name: 'sortby',
                  schema: {
                    type: 'string',
                    description: 'comma-separated list of &lt;column name&gt;.&lt;sort direction&gt;. Defaults to &lt;resourceId:ASC&gt;. Sorting is done in the order the columns appear in the list. For example:\n' +
                      '- `sortby=treatmentTitle:ASC,rank:DESC`\n' +
                      '  **Note:** sort direction can be ASC or DESC',
                    default: 'resourceId:ASC'
                  },
                  defaultCol: false
                },
                {
                  name: 'groupby',
                  schema: {
                    type: 'string',
                    description: 'Fully-qualified name of column by which to group the results. For example:\n' +
                      '- `groupby=images.httpUri`',
                    default: ''
                  },
                  defaultCol: false
                },
                {
                  name: 'cols',
                  schema: {
                    type: 'array',
                    items: { type: 'string' },
                    description: "Columns to retreive in the result set. Order of columns doesn't matter. Provide columns like so:\n" +
                      '- `cols=column1&cols=column2&cols=column3`'
                  },
                  defaultCol: false
                }
            ]
        }
    ],
    getResourceProperties: [
        {
            input: [null],
            wanted: `    - title
    - name
    - singleDatabase
    - attachedDatabase
    - summary
    - description
    - tableType
    - sqliteExtension
    - viewSource
    - isWithoutRowid
    - params
    - triggers
    - inserts
    - source
    - tags`
        }
    ],
    getResources: [
        {
            input: [null],
            wanted: [
                'biomes',           'bibRefCitations',
                'classes',          'collectionCodes',
                'ecoregions',       'families',
                'figureCitations',  'genera',
                'images',           'journals',
                'kingdoms',         'materialCitations',
                'orders',           'phyla',
                'realms',           'species',
                'treatmentAuthors', 'treatmentCitations',
                'treatments'
            ]
        },
        {
            input: ['summary'],
            wanted: {
                biomes: 'Biomes of the world',
                bibRefCitations: 'Fetches bibliographic reference citations of the treatments',
                classes: 'Classes of treatments',
                collectionCodes: 'Fetches collection codes',
                ecoregions: 'Ecoregions of the world',
                families: 'Families of treatments',
                figureCitations: 'Fetches figure citations of the treatments',
                genera: 'Genera of treatments',
                images: 'Fetches treatment-related images',
                journals: 'Fetches journals',
                kingdoms: 'Kingdoms of treatments',
                materialCitations: 'Material citations of the treatments',
                orders: 'Orders of treatments',
                phyla: 'Phyla of treatments',
                realms: 'Realms of the world',
                species: 'Species of treatments',
                treatmentAuthors: 'Fetches treatment authors',
                treatmentCitations: 'Fetches treatment citations of the treatments',
                treatments: 'Fetches treatments'
              }
        }
    ],
    getResource: [
        {
            input: ['treatments', 'summary'],
            wanted: 'Fetches treatments'
        }
    ],
    getResourceId: [
        {
            input: ['treatments'],
            wanted: {
                name: 'treatmentId',
                schema: {
                  type: 'string',
                  maxLength: 32,
                  minLength: 32,
                  description: 'Has to be a 32 character string:\n' +
                    '- `treatmentId=388D179E0D564775C3925A5B93C1C407`'
                },
                sql: {
                  desc: 'The unique resourceId of the treatment',
                  type: 'TEXT UNIQUE NOT NULL CHECK(Length(treatmentId) = 32)'
                },
                cheerio: '$("document").attr("docId")',
                isResourceId: true,
                selname: 'treatments.treatmentId',
                where: 'treatments.treatmentId',
                defaultOp: '='
            }
        }
    ],
};

Object.keys(testGroups).forEach((testGroupName) => {
    const tests = testGroups[testGroupName];
    
    tests.forEach((test, i) => {
        tap.test(`${testGroupName} ${i}`, tap => {
            const found = funcsToTest[testGroupName](...test.input);
            tap.same(found, test.wanted);
            tap.end();
        });
    });
});
