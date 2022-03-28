'use strict'

/*
 * This is the only place where configuration for  
 * all the routes is described.
 */
module.exports = [
    {
        name: 'treatments',
        summary: 'Fetch treatments',
        description: '',
        dictionary: require('./resources/zenodeo/treatments'),
        source: 'zenodeo'
    },
    {
        name: 'treatmentCitations',
        summary: 'Fetch treatmentCitations of the treatments',
        description: '',
        dictionary: require('./resources/zenodeo/treatmentCitations'),
        source: 'zenodeo'
    },
    {
        name: 'bibRefCitations',
        summary: 'Fetch bibRefCitations of the treatments',
        description: '',
        dictionary: require('./resources/zenodeo/bibRefCitations'),
        source: 'zenodeo'
    },
    {
        name: 'figureCitations',
        summary: 'Fetch figureCitations of the treatments',
        description: '',
        dictionary: require('./resources/zenodeo/figureCitations'),
        source: 'zenodeo'
    },
    {
        name: 'materialsCitations',
        summary: 'Fetch materialsCitations of the treatments',
        description: '',
        dictionary: require('./resources/zenodeo/materialsCitations'),
        source: 'zenodeo'
    },
    {
        name: 'treatmentImages',
        summary: 'Fetch treatment images from Zenodeo',
        description: '',
        dictionary: require('./resources/zenodeo/treatmentImages-new'),
        source: 'zenodeo'
    },
    {
        name: 'collectionCodes',
        summary: 'Fetch collectionCodes of the materialsCitations',
        description: '',
        dictionary: require('./resources/zenodeo/collectionCodes'),
        source: 'zenodeo'
    },
    {
        name: 'images',
        summary: 'Fetch images from Zenodo',
        description: '',
        dictionary: require('./resources/zenodo/images'),
        source: 'zenodo'
    },
    {
        name: 'publications',
        summary: 'Fetch publications from Zenodo',
        description: '',
        dictionary: require('./resources/zenodo/publications'),
        source: 'zenodo'
    },
    {
        name: 'families',
        summary: 'Fetch families',
        description: '',
        dictionary: require('./resources/zenodeo/families'),
        source: 'zenodeo'
    }
]