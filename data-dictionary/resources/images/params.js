import * as utils from '../../../lib/utils.js';
import { treatments } from '../treatments/index.js';
import { imagesFts } from '../imagesFts/index.js';
import { treatmentsFts } from '../treatmentsFts/index.js';
import { materialCitations } from '../materialCitations/index.js';
import { journals } from '../journals/index.js';
import { ecoregions } from '../ecoregions/index.js';
import { biomes } from '../biomes/index.js';
import { realms } from '../realms/index.js';
import { kingdoms } from '../kingdoms/index.js';
import { phyla } from '../phyla/index.js';
import { classes } from '../classes/index.js';
import { families } from '../families/index.js';
import { orders } from '../orders/index.js';
import { genera } from '../genera/index.js';
import { species } from '../species/index.js';
import { collectionCodes } from '../collectionCodes/index.js';

const params = [
    {
        name: 'id',
        alias: 'images_id',
        sql: {
            type: 'INTEGER PRIMARY KEY',
            desc: 'PK'
        },
        schema: { 
            type: 'integer', 
            description: 'The unique ID of the image',
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
        name: 'caption',
        selname: 'images.captionText',
        where: 'images.captionText',
        //name: 'captionText',
        //alias: 'caption',
        schema: {
            type: 'string',
            description: `A snippet extracted from the caption of the image. Can use the following syntax: 
- \`caption=starts_with(spiders)\``
        },
        sql: {
            desc: 'The text of the figure cited by this treatment',
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
    },
];

const externalParams = [

    // imagesFts
    {
        dict: imagesFts,
        cols: [
            {
                name: 'captionText',
                joins: [
                    'JOIN imagesFts ON images.id = imagesFts.rowid'
                ]
            }
        ]
    },

    // treatmentsFts
    {
        dict: treatmentsFts,
        cols: [
            {
                name: 'q',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid'
                ]
            }
        ]
    },

    // treatments
    {
        dict: treatments,
        cols: [
            {
                name: 'treatmentId',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id'
                ]
            },
            {
                name: 'treatmentTitle',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id'
                ]
            },
            {
                name: 'treatmentDOI',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id'
                ]
            },
            {
                name: 'zenodoDep',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id'
                ]
            },
            {
                name: 'articleDOI',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id'
                ]
            },
            {
                name: 'articleTitle',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id'
                ]
            },
            {
                name: 'articleAuthor',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id'
                ]
            },
            {
                name: 'authorityName',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id'
                ]
            },
            {
                name: 'status',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id'
                ]
            },
            {
                name: 'journalYear',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id'
                ]
            },
            {
                name: 'publicationDate',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id'
                ]
            },
            {
                name: 'checkinTime',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id'
                ]
            }
        ]
    },

    // journals
    {
        dict: journals,
        cols: [
            {
                name: 'journalTitle',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN journals ON treatments.journals_id = journals.id'
                ]
            }
        ]
    },

    // kingdoms
    {
        dict: kingdoms,
        cols: [
            {
                name: 'kingdom',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN kingdoms ON treatments.kingdoms_id = kingdoms.id'
                ]
            }
        ]
    },

    // phyla
    {
        dict: phyla,
        cols: [
            {
                name: 'phylum',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN phyla ON treatments.phyla_id = phyla.id'
                ]
            }
        ]
    },

    // classes
    {
        dict: classes,
        cols: [
            {
                name: 'class',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN classes ON treatments.classes_id = classes.id'
                ]
            }
        ]
    },

    // families
    {
        dict: families,
        cols: [
            {
                name: 'family',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN families ON treatments.families_id = families.id'
                ]
            }
        ]
    },

    // orders
    {
        dict: orders,
        cols: [
            {
                name: 'order',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN orders ON treatments.orders_id = orders.id'
                ]
            }
        ]
    },

    // genera
    {
        dict: genera,
        cols: [
            {
                name: 'genus',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN genera ON treatments.genera_id = genera.id'
                ]
            },
        ]
    },

    // species
    {
        dict: species,
        cols: [
            {
                name: 'species',
                joins: [
                    'JOIN treatments ON images.treatments_id = treatments.id',
                    'JOIN species ON treatments.species_id = species.id'
                ]
            }
        ]
    },

    // materialCitations
    {
        dict: materialCitations,
        cols: [
            {
                name: 'latitude',
                joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id'
                ]
            },
            {
                name: 'longitude',
                joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id'
                ]
            },
            {
                name: 'geolocation',
                joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id',
                    'JOIN materialCitationsRtree ON materialCitations.id = materialCitationsRtree.id'
                ]
            },
            {
                name: 'isOnLand',
                joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id'
                ]
            },
            {
                name: 'validGeo',
                joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id'
                ]
            }
        ]
    },

    // ecoregions
    {
        dict: ecoregions,
        cols: [
            {
                name: 'eco_name',
                joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id',
                    `JOIN geodata.ecoregions ON materialCitations.ecoregions_id = geodata.ecoregions.id`
                ]
            }
        ]
    },

    // biomes
    {
        dict: biomes,
        cols: [
            {
                name: 'biome',
                joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id',
                    'JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id'
                ]
            }
        ]
    },

    // realms
    {
        dict: realms,
        cols: [
            {
                name: 'realm',
                joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id',
                    'JOIN geodata.realms ON materialCitations.realms_id = geodata.realms.id'
                ]
            }
        ]
    },

    // collectionCodes
    {
        dict: collectionCodes,
        cols: [
            {
                name: 'name',
                selname: 'collectionName',
                joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id',
                    'JOIN materialCitations_collectionCodes ON materialCitations.id = materialCitations_collectionCodes.materialCitations_id',
                    'JOIN collectionCodes ON materialCitations_collectionCodes.collectionCodes_id = collectionCodes.id'
                ]
            },

            {
                name: 'collectionCode',
                joins: [
                    'JOIN materialCitations ON images.treatments_id = materialCitations.treatments_id',
                    'JOIN materialCitations_collectionCodes ON materialCitations.id = materialCitations_collectionCodes.materialCitations_id',
                    'JOIN collectionCodes ON materialCitations_collectionCodes.collectionCodes_id = collectionCodes.id'
                ]
            }
        ]
    }
];

const allNewParams = utils.addExternalParams(externalParams);
params.push(...allNewParams);

export { params }