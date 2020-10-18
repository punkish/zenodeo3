'use strict'

/**************************************************************
 * 
 * The config options this file modify config/default when the
 * app is running in TEST mode
 * 
 **************************************************************/

module.exports = {
    url: {
        zenodeo: 'http://test.zenodeo.org/v3'
    },
    pino: {
        opts: {
            level: 'error'
        }
    },
    v3: {
        swagger: {
            options: {
                swagger: {

                    // make sure there is no scheme before the host
                    // that is, there should not be any 'http(s)://'
                    host: 'test.zenodeo.org/'
                }
            }
        }
    },
}