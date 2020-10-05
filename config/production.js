'use strict'

/**************************************************************
 * 
 * The config options this file modify config/default when the
 * app is running in PRODUCTION mode
 * 
 **************************************************************/

module.exports = {
    url: {
        zenodeo: 'http://zenodeo.org/v3',
        zenodo: 'https://zenodo.org/api'
    },
    pino: {
        opts: {
            level: 'error'
        }
    },
    debug: false,
    v3: {
        swagger: {

            // make sure there is no scheme before the host
            // that is, there should not be any 'http(s)://'
            host: 'zenodeo.org'
        }
    }
};