'use strict'

/**************************************************************
 * 
 * The config options start with all the values in this file
 * 
 **************************************************************/

module.exports = {
    url: 'http://test.zenodeo.org/v3',
    v3: {
        swagger: {
            options: {
                swagger: {
                    host: 'http://test.zenodeo.org/'
                }
            }
        },

        cache: {

            // default cache duration 1 day (24 hours)
            duration: 1 * 60 * 60 * 1000
        }
    },
}