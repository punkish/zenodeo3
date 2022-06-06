'use strict'

/*
 * This is the only place where configuration for  
 * all the routes is described.
 */
const resources = [
    {
        name: 'etlstats',
        summary: 'etl statistics',
        dictionary: require(`./resources/metadata/etlstats.js`),
        description: 'Information about the Extract-Transform-Load process',
        tags: [ 'meta' ]
    },
    {
        name: 'treatments',
        summary: 'Fetch treatments',
        dictionary: require('./resources/zenodeo/treatments.js'),
        description: 'treatments of species',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'treatmentCitations',
        summary: 'Fetch treatmentCitations of the treatments',
        dictionary: require('./resources/zenodeo/treatmentCitations.js'),
        description: 'treatment citations citing the treatment',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'bibRefCitations',
        summary: 'Fetch bibRefCitations of the treatments',
        dictionary: require('./resources/zenodeo/bibRefCitations.js'),
        description: 'bibliographic citations of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'figureCitations',
        summary: 'Fetch figureCitations of the treatments',
        dictionary: require('./resources/zenodeo/figureCitations.js'),
        description: 'figure citations of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'materialsCitations',
        summary: 'Fetch materialsCitations of the treatments',
        dictionary: require('./resources/zenodeo/materialsCitations.js'),
        description: 'material citations of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'treatmentImages',
        summary: 'Fetch treatment images from Zenodeo',
        dictionary: require('./resources/zenodeo/treatmentImages.js'),
        description: 'images related to treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'collectionCodes',
        summary: 'Fetch collectionCodes of the materialsCitations',
        dictionary: require('./resources/zenodeo/collectionCodes.js'),
        description: 'collection codes of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'images',
        summary: 'Fetch images from Zenodo',
        dictionary: require('./resources/zenodo/images.js'),
        description: 'images extracted from scientific literature',
        source: 'zenodo',
        tags: [ 'zenodo' ]
    },
    {
        name: 'publications',
        summary: 'Fetch publications from Zenodo',
        dictionary: require('./resources/zenodo/publications.js'),
        description: 'scientific publications',
        source: 'zenodo',
        tags: [ 'zenodo' ]
    },
    {
        name: 'families',
        summary: 'Fetch families',
        dictionary: require('./resources/zenodeo/families.js'),
        description: 'families of species',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    }
];

module.exports = resources;