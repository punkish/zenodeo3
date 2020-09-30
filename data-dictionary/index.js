'use strict'

/*
 * This is the only place where configuration for  
 * all the routes is described.
 */
module.exports = [
    {
        name: 'treatments',
        description: 'Fetch treatments',
        dictionary: require('./resources/treatments')
    },
    {
        name: 'treatmentCitations',
        description: 'Fetch treatmentCitations of the treatments',
        dictionary: require('./resources/treatmentCitations')
    },
    {
        name: 'bibRefCitations',
        description: 'Fetch bibRefCitations of the treatments',
        dictionary: require('./resources/bibRefCitations')
    },
    {
        name: 'figureCitations',
        description: 'Fetch figureCitations of the treatments',
        dictionary: require('./resources/figureCitations')
    },
    {
        name: 'materialsCitations',
        description: 'Fetch materialsCitations of the treatments',
        dictionary: require('./resources/materialsCitations')
    }
]
