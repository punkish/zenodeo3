'use strict';

/*
 * This is the only place where configuration for  
 * all the routes is described.
 */
const ddpath = '../../data-dictionary/resources';

const resources = [
    {
        name: 'root',
        url: '',
        summary: 'root of the API',
        dictionary: '',
        description: 'This is where it starts',
        tags: [ 'meta' ]
    },
    {
        name: 'etlstats',
        url: 'etlstats',
        summary: 'etl statistics',
        dictionary: require(`${ddpath}/metadata/etlstats.js`),
        description: 'Information about the Extract-Transform-Load process',
        tags: [ 'meta' ]
    },
    {
        name: 'treatments',
        url: 'treatments',
        summary: 'Fetch treatments',
        dictionary: require(`${ddpath}/zenodeo/treatments.js`),
        description: 'treatments of species',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'treatmentCitations',
        url: 'treatmentcitations',
        summary: 'Fetch treatmentCitations of the treatments',
        dictionary: require(`${ddpath}/zenodeo/treatmentCitations.js`),
        description: 'treatment citations citing the treatment',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'bibRefCitations',
        url: 'bibrefcitations',
        summary: 'Fetch bibRefCitations of the treatments',
        dictionary: require(`${ddpath}/zenodeo/bibRefCitations.js`),
        description: 'bibliographic citations of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'figureCitations',
        url: 'figurecitations',
        summary: 'Fetch figureCitations of the treatments',
        dictionary: require(`${ddpath}/zenodeo/figureCitations.js`),
        description: 'figure citations of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'materialsCitations',
        url: 'materialscitations',
        summary: 'Fetch materialsCitations of the treatments',
        dictionary: require(`${ddpath}/zenodeo/materialsCitations.js`),
        description: 'material citations of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'treatmentImages',
        url: 'treatmentimages',
        summary: 'Fetch treatment images from Zenodeo',
        dictionary: require(`${ddpath}/zenodeo/treatmentImages.js`),
        description: 'images related to treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'collectionCodes',
        url: 'collectioncodes',
        summary: 'Fetch collectionCodes of the materialsCitations',
        dictionary: require(`${ddpath}/zenodeo/collectionCodes.js`),
        description: 'collection codes of treatments',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    },
    {
        name: 'images',
        url: 'images',
        summary: 'Fetch images from Zenodo',
        dictionary: require(`${ddpath}/zenodo/images.js`),
        description: 'images extracted from scientific literature',
        source: 'zenodo',
        tags: [ 'zenodo' ]
    },
    {
        name: 'publications',
        url: 'publications',
        summary: 'Fetch publications from Zenodo',
        dictionary: require(`${ddpath}/zenodo/publications.js`),
        description: 'scientific publications',
        source: 'zenodo',
        tags: [ 'zenodo' ]
    },
    {
        name: 'families',
        url: 'families',
        summary: 'Fetch families',
        dictionary: require(`${ddpath}/zenodeo/families.js`),
        description: 'families of species',
        source: 'zenodeo',
        tags: [ 'zenodeo' ]
    }
];

module.exports = resources;