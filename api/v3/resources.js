'use strict'

const config = require('config');
const url = config.get('url');

/*
 * This is the only place where configuration for  
 * all the routes is described.
 */
const ddpath = '../../data-dictionary/resources';

const resources = [
    {
        name: 'root',
        url: url.zenodeo,
        summary: 'root of the API',
        description: 'This is where it starts',
        tags: [ 'meta' ]
    },
    {
        name: 'etlstats',
        url: `${url.zenodeo}/etlstats`,
        summary: 'etl statistics',
        description: 'Information about the Extract-Transform-Load process',
        tags: [ 'meta' ]
    },
    {
        name: 'treatments',
        url: `${url.zenodeo}/treatments`,
        summary: 'Fetch treatments',
        dictionary: require(`${ddpath}/zenodeo/treatments.js`),
        description: 'treatments of species',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'treatmentCitations',
        url: `${url.zenodeo}/treatmentcitations`,
        summary: 'Fetch treatmentCitations of the treatments',
        dictionary: require(`${ddpath}/zenodeo/treatmentCitations.js`),
        description: 'treatment citations citing the treatment',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'bibRefCitations',
        url: `${url.zenodeo}/bibrefcitations`,
        summary: 'Fetch bibRefCitations of the treatments',
        dictionary: require(`${ddpath}/zenodeo/bibRefCitations.js`),
        description: 'bibliographic citations of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'figureCitations',
        url: `${url.zenodeo}/figurecitations`,
        summary: 'Fetch figureCitations of the treatments',
        dictionary: require(`${ddpath}/zenodeo/figureCitations.js`),
        description: 'figure citations of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'materialsCitations',
        url: `${url.zenodeo}/materialscitations`,
        summary: 'Fetch materialsCitations of the treatments',
        dictionary: require(`${ddpath}/zenodeo/materialsCitations.js`),
        description: 'material citations of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'treatmentImages',
        url: `${url.zenodeo}/treatmentimages`,
        summary: 'Fetch treatment images from Zenodeo',
        dictionary: require(`${ddpath}/zenodeo/treatmentImages.js`),
        description: 'images related to treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'collectionCodes',
        url: `${url.zenodeo}/collectioncodes`,
        summary: 'Fetch collectionCodes of the materialsCitations',
        dictionary: require(`${ddpath}/zenodeo/collectionCodes.js`),
        description: 'collection codes of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'images',
        url: `${url.zenodeo}/images`,
        summary: 'Fetch images from Zenodo',
        dictionary: require(`${ddpath}/zenodo/images.js`),
        description: 'images extracted from scientific literature',
        source: 'zenodo',
        tags: [ 'zenodo' ]
    },
    {
        name: 'publications',
        url: `${url.zenodeo}/publications`,
        summary: 'Fetch publications from Zenodo',
        dictionary: require(`${ddpath}/zenodo/publications.js`),
        description: 'scientific publications',
        source: 'zenodo',
        tags: [ 'zenodo' ]
    },
    {
        name: 'families',
        url: `${url.zenodeo}/families`,
        summary: 'Fetch families',
        dictionary: require(`${ddpath}/zenodeo/families.js`),
        description: 'families of species',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    }
];

module.exports = resources;