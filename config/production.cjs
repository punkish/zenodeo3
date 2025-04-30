module.exports = {
    "schemes": [ "https" ],
    "url": {
        "zenodeo": "https://test.zenodeo.org",
        "swagger": "https://test.zenodeo.org"
    },

    // log only errors
    // 
    "pino": {
        "opts": {
            "level": "error"
        }
    },

    // zlogger options
    //
    "zlogger": {
        "level"     : "error",
        "transports": [ 'file' ],
    },
    
    // don't add debug info to results 
    // 
    "isDebug": false,

    "cache": {
        "on": true,

        //  
        // set default cache duration to 7 days
        //  
        //     +------------------------- days
        //     |    +-------------------- hours
        //     |    |    +--------------- mins
        //     |    |    |    +---------- secs
        //     |    |    |    |    +----- ms
        //     |    |    |    |    |
        "ttl": 7 * 24 * 60 * 60 * 1000 
    },
}