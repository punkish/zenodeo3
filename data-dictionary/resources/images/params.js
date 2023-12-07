import * as utils from '../../../lib/utils.js';
import { treatments } from '../treatments/index.js';
import { imagesFts } from '../imagesFts/index.js';
import { treatmentsFts } from '../treatmentsFts/index.js';
import { materialCitations } from '../materialCitations/index.js';
import { journals } from '../journals/index.js';
import { ecoregions } from '../ecoregions/index.js';
import { biomes } from '../biomes/index.js';

const params = [
    {
        name: 'id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the images',
        },
        isResourceId: true
    },
    {
        name: 'httpUri',
        schema: {
            type: 'string',
            description: `Can use the following syntax: 
- \`httpUri=eq(http://example.com)\``
        },
        sql: {
            type: 'TEXT NOT NULL UNIQUE',
            desc: 'The URI of the image. '
        }
    },
    {
        name: 'figureDoiOriginal',
        sql: {
            desc: 'The DOI of the image as extracted',
            type: 'TEXT'
        },
        cheerio: '$("figureCitation").attr("figureDoi")'
    },
    {
        name: 'figureDoi',
        schema: {
            type: 'string',
            description: `Can use the following syntax: 
- \`figureDoi=eq(http://doi.org/10.5281/zenodo.3850863)\``
        },
        sql: {
            desc: 'The DOI of the image cleaned up',
            type: `TEXT GENERATED ALWAYS AS (
                Iif(
                    Instr(figureDoiOriginal, '/10.'), 
                    Substr(
                        figureDoiOriginal, 
                        Instr(figureDoiOriginal, '/10.') + 1
                    ), 
                    figureDoiOriginal
                ) 
            ) STORED`
        },
        cheerio: '$("figureCitation").attr("figureDoi")'
    },
    {
        name: 'captionText',
        alias: 'caption',
        schema: {
            type: 'string',
            description: `A snippet extracted from the caption of the image. Can use the following syntax: 
- \`caption=starts_with(spiders)\``
        },
        sql: {
            desc: 'The full text of the figure cited by this treatment',
            type: 'TEXT COLLATE NOCASE'
        },
        cheerio: '$("figureCitation").attr("captionText")'
    },
    {
        name: 'treatments_id',
        schema: {
            type: 'integer',
            description: ``
        },
        sql: {
            desc: 'The FK of the parent treatment',
            type: 'INTEGER NOT NULL REFERENCES treatments(id)'
        },
        //cheerio: '$("figureCitation").attr("captionText")'
    },
];

/** 
 * then we add params that are in other tables but can be queried 
 * via this REST endpoint
 */
 const externalParams = [
    {
        name: 'captionText',
        dict: imagesFts,
        joins: [
            'JOIN imagesFts ON images.id = imagesFts.rowid'
        ]
    },
    {
        name: 'q',
        dict: treatmentsFts,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid'
        ]
    },
    {
        name: 'treatmentId',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id'
        ]
    },
    {
        name: 'treatmentTitle',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id'
        ]
    },
    {
        name: 'treatmentDOI',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id'
        ]
    },
    {
        name: 'zenodoDep',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id'
        ]
    },
    {
        name: 'articleDOI',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id'
        ]
    },
    {
        name: 'articleTitle',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id'
        ]
    },
    {
        name: 'articleAuthor',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id'
        ]
    },
    {
        name: 'authorityName',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id'
        ]
    },
    {
        name: 'status',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id'
        ]
    },
    {
        name: 'journalTitle',
        dict: journals,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN journals ON treatments.journals_id = journals.id'
        ]
    },
    {
        name: 'journalYear',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id'
        ]
    },
    {
        name: 'publicationDateMs',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id'
        ]
    },
    {
        name: 'kingdom',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN kingdoms ON treatments.kingdoms_id = kingdoms.id'
        ]
    },
    {
        name: 'phylum',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN phyla ON treatments.phyla_id = phyla.id'
        ]
    },
    {
        name: 'class',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN classes ON treatments.classes_id = classes.id'
        ]
    },
    {
        name: 'family',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN families ON treatments.families_id = families.id'
        ]
    },
    {
        name: 'order',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN orders ON treatments.orders_id = orders.id'
        ]
    },
    {
        name: 'genus',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN genera ON treatments.genera_id = genera.id'
        ]
    },
    {
        name: 'species',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN species ON treatments.species_id = species.id'
        ]
    },
    {
        name: 'publicationDate',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id'
        ]
    },
    {
        name: 'checkinTime',
        dict: treatments,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id'
        ]
    },
    {
        name: 'latitude',
        dict: materialCitations,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN materialCitations ON treatments.id = materialCitations.treatments_id'
        ]
    },
    {
        name: 'longitude',
        dict: materialCitations,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN materialCitations ON treatments.id = materialCitations.treatments_id'
        ]
    },
    {
        name: 'geolocation',
        dict: materialCitations,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN materialCitations ON treatments.id = materialCitations.treatments_id',
            'JOIN materialCitationsRtree ON materialCitations.id = materialCitationsRtree.materialCitations_id'
        ]
    },
    {
        name: 'isOnLand',
        dict: materialCitations,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN materialCitations ON treatments.id = materialCitations.treatments_id'
        ]
    },
    {
        name: 'validGeo',
        dict: materialCitations,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN materialCitations ON treatments.id = materialCitations.treatments_id'
        ]
    },
    {
        name: 'eco_name',
        dict: ecoregions,
        joins: [
            `JOIN treatments ON images.treatments_id = treatments.id`,
            `JOIN materialCitations ON treatments.id = materialCitations.treatments_id`,
            `JOIN geodata.ecoregions ON materialCitations.ecoregions_id = geodata.ecoregions.id`
        ]
    },
    {
        name: 'biome',
        dict: biomes,
        joins: [
            'JOIN treatments ON images.treatments_id = treatments.id',
            'JOIN materialCitations ON treatments.id = materialCitations.treatments_id',
            'JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id'
        ]
    }
];

externalParams.forEach(externalParam => utils.addExternalDef(
    externalParam, 
    'images', 
    'id', 
    params
));

export { params }


// SELECT Count(*) AS num_of_records 
// FROM 
//     images JOIN 
//     treatments ON images.treatments_id = treatments.id JOIN 
//     materialCitations ON treatments.id = materialCitations.treatments_id JOIN 
//     geodata.ecoregions ON materialCitations.ecoregions_id = geodata.ecoregions.id JOIN 
//     geodata.biomes ON geodata.ecoregions.biomes_id = geodata.biomes.id JOIN 
//     geodata.biome_synonyms ON geodata.biomes.id = geodata.biome_synonyms.biomes_id  
// WHERE geodata.biome_synonyms.synonym LIKE 'pampas%'

// SELECT Count(*) AS num_of_records 
// FROM 
//     images JOIN 
//     treatments ON images.treatments_id = treatments.id JOIN 
//     materialCitations ON treatments.id = materialCitations.treatments_id JOIN 
//     geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.id   
// WHERE geodata.biome_synonyms.synonym LIKE 'pampas%'