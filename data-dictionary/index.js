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
        dictionary: require('./resources/treatments'),
        source: 'zenodeo'
    },
    {
        name: 'treatmentCitations',
        summary: 'Fetch treatmentCitations of the treatments',
        description: '',
        dictionary: require('./resources/treatmentCitations'),
        source: 'zenodeo'
    },
    {
        name: 'bibRefCitations',
        summary: 'Fetch bibRefCitations of the treatments',
        description: '',
        dictionary: require('./resources/bibRefCitations'),
        source: 'zenodeo'
    },
    {
        name: 'figureCitations',
        summary: 'Fetch figureCitations of the treatments',
        description: '',
        dictionary: require('./resources/figureCitations'),
        source: 'zenodeo'
    },
    {
        name: 'materialsCitations',
        summary: 'Fetch materialsCitations of the treatments',
        description: '',
        dictionary: require('./resources/materialsCitations'),
        source: 'zenodeo'
    },
    {
        name: 'collectionCodes',
        summary: 'Fetch collectionCodes of the materialsCitations',
        description: '',
        dictionary: require('./resources/collectionCodes'),
        source: 'zenodeo'
    },
    {
        name: 'images',
        summary: 'Fetch images from Zenodo',
        description: '',
        dictionary: require('./resources/images'),
        source: 'zenodo'
    },
    {
        name: 'publications',
        summary: 'Fetch publications from Zenodo',
        description: '',
        dictionary: require('./resources/publications'),
        source: 'zenodo'
    },
    {
        name: 'families',
        summary: 'Fetch families',
        description: '',
        dictionary: require('./resources/families'),
        source: 'zenodeo'
    },
    {
        name: 'fake',
        summary: 'Fetch families',
        description: '',
        dictionary: require('./resources/fake'),
        source: 'zenodeo'
    },
]