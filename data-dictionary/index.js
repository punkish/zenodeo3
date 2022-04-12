'use strict'

/*
 * This is the only place where configuration for  
 * all the routes is described.
 */

const resources = [
    {
        name: 'treatments',
        summary: 'Fetch treatments',
        description: './resources/zenodeo/treatments.js'
    },
    {
        name: 'treatmentCitations',
        summary: 'Fetch treatmentCitations of the treatments',
        description: './resources/zenodeo/treatmentCitations'
    },
    {
        name: 'bibRefCitations',
        summary: 'Fetch bibRefCitations of the treatments',
        description: './resources/zenodeo/bibRefCitations'
    },
    {
        name: 'figureCitations',
        summary: 'Fetch figureCitations of the treatments',
        description: './resources/zenodeo/figureCitations'
    },
    {
        name: 'materialsCitations',
        summary: 'Fetch materialsCitations of the treatments',
        description: './resources/zenodeo/materialsCitations'
    },
    {
        name: 'treatmentImages',
        summary: 'Fetch treatment images from Zenodeo',
        description: './resources/zenodeo/treatmentImages'
    },
    {
        name: 'collectionCodes',
        summary: 'Fetch collectionCodes of the materialsCitations',
        description: './resources/zenodeo/collectionCodes'
    },
    {
        name: 'images',
        summary: 'Fetch images from Zenodo',
        description: './resources/zenodo/images'
    },
    {
        name: 'publications',
        summary: 'Fetch publications from Zenodo',
        description: './resources/zenodo/publications'
    },
    {
        name: 'families',
        summary: 'Fetch families',
        description: './resources/zenodeo/families'
    }
];

resources.forEach(r => {
    r.dictionary = require(r.description);
    r.source = r.description.split('/')[2];
});

module.exports = resources;