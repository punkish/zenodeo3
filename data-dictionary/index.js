'use strict'

/*
 * This is the only place where configuration for  
 * all the routes is described.
 */
module.exports = [
    {
        name: 'treatments',
        description: 'Fetch treatments',
        dictionary: require('./resources/treatments'),
        source: 'zenodeo'
    },
    {
        name: 'treatmentCitations',
        description: 'Fetch treatmentCitations of the treatments',
        dictionary: require('./resources/treatmentCitations'),
        source: 'zenodeo'
    },
    {
        name: 'bibRefCitations',
        description: 'Fetch bibRefCitations of the treatments',
        dictionary: require('./resources/bibRefCitations'),
        source: 'zenodeo'
    },
    {
        name: 'figureCitations',
        description: 'Fetch figureCitations of the treatments',
        dictionary: require('./resources/figureCitations'),
        source: 'zenodeo'
    },
    {
        name: 'materialsCitations',
        description: 'Fetch materialsCitations of the treatments',
        dictionary: require('./resources/materialsCitations'),
        source: 'zenodeo'
    },
    {
        name: 'images',
        description: 'Fetch images from Zenodo',
        dictionary: require('./resources/images'),
        source: 'zenodo'
    },
    {
        name: 'publications',
        description: 'Fetch publications from Zenodo',
        dictionary: require('./resources/publications'),
        source: 'zenodo'
    }
]