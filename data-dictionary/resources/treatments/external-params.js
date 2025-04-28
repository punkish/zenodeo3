import { treatmentsFts } from '../treatmentsFts/index.js';
import { materialCitations } from '../materialCitations/index.js';
import { collectionCodes } from '../collectionCodes/index.js';
import { journals } from '../journals/index.js';
import { kingdoms } from '../kingdoms/index.js';
import { phyla } from '../phyla/index.js';
import { classes } from '../classes/index.js';
import { orders } from '../orders/index.js';
import { families } from '../families/index.js';
import { genera } from '../genera/index.js';
import { species } from '../species/index.js';
import { ecoregions } from '../ecoregions/index.js';
import { biomes } from '../biomes/index.js';

export const externalParams = [

    // treatmentsFts
    {
        dict: treatmentsFts,
        cols: [
            {
                name: 'q',
                joins: [
                    'JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid'
                ]
            }
        ]
    },

    // collectionCodes
    {
        dict: collectionCodes,
        cols: [
            {
                name: 'collectionCode',
                joins: [
                    `LEFT JOIN materialCitations ON treatments.id = materialCitations.treatments_id`,
                    `JOIN materialCitations_collectionCodes ON materialCitations.id = materialCitations_collectionCodes.materialCitations_id`,
                    `JOIN collectionCodes ON materialCitations_collectionCodes.collectionCodes_id = collectionCodes.id`
                ]
            },
        ]
    },

    // materialCitations
    {
        dict: materialCitations,
        cols: [
            {
                name: 'latitude',
                joins: [
                    'JOIN materialCitations ON treatments.id = materialCitations.treatments_id'
                ]
            },
            {
                name: 'longitude',
                joins: [
                    'JOIN materialCitations ON treatments.id = materialCitations.treatments_id'
                ]
            },
            {
                name: 'geolocation',
                joins: [
                    'JOIN materialCitationsRtree ON materialCitations.id = materialCitationsRtree.id'
                ]
            },
            {
                name: 'isOnLand',
                joins: [
                    'JOIN materialCitations ON treatments.id = materialCitations.treatments_id'
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
                    `JOIN materialCitations ON treatments.id = materialCitations.treatments_id`,
                    `JOIN geodata.ecoregions ON materialCitations.ecoregions_id = geodata.ecoregions.id`
                ]
            },
            {
                name: 'biome_name',
                joins: [
                    `JOIN materialCitations ON treatments.id = materialCitations.treatments_id`,
                    `JOIN geodata.ecoregions ON materialCitations.ecoregions_id = geodata.ecoregions.id`
                ]
            },
        ]
    },

    // journals
    {
        dict: journals,
        cols: [
            {
                name: 'journalTitle',
                joins: [
                    `JOIN journals ON treatments.journals_id = journals.id`
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
                    `JOIN kingdoms ON treatments.kingdoms_id = kingdoms.id`
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
                    `JOIN phyla ON treatments.phyla_id = phyla.id`
                ]
            },
        ]
    },

    // classes
    {
        dict: classes,
        cols: [
            {
                name: 'class',
                joins: [
                    `JOIN classes ON treatments.classes_id = classes.id`
                ]
            },
        ]
    },

    // orders
    {
        dict: orders,
        cols: [
            {
                name: 'order',
                joins: [
                    `JOIN orders ON treatments.orders_id = orders.id`
                ]
            },
        ]
    },

    // families
    {
        dict: families,
        cols: [
            {
                name: 'family',
                joins: [
                    `JOIN families ON treatments.families_id = families.id`
                ]
            },
        ]
    },

    // genera
    {
        dict: genera,
        cols: [
            {
                name: 'genus',
                joins: [
                    `JOIN genera ON treatments.genera_id = genera.id`
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
                    `JOIN species ON treatments.species_id = species.id`
                ]
            },
        ]
    },

    // biomes
    {
        dict: biomes,
        cols: [
            {
                name: 'biome',
                joins: [
                    'JOIN materialCitations ON treatments.id = materialCitations.treatments_id',
                    'JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id'
                ]
            }
        ]
    }

];