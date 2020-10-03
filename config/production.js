'use strict'

/**************************************************************
 * 
 * The config options start with all the values in this file
 * 
 **************************************************************/

module.exports = {
    port: 3010,
    url: 'https://zenodeo.info/v3',
    pino: {
        opts: {
            level: 'error'
        }
    },
    debug: false,
    v3: {
        swagger: {
            host: 'https://zenodeo.info'
        }
    }
};