module.exports = {
    "schemes": [ "https" ],
    "url": {
        "zenodeo": "test.zenodeo.org",
        "swagger": "test.zenodeo.org"
    },

    "cache": {
        "on": true,

        //  
        // set default cache duration to 1 day
        //  
        //     +------------------------- days
        //     |    +-------------------- hours
        //     |    |    +--------------- mins
        //     |    |    |    +---------- secs
        //     |    |    |    |    +----- ms
        //     |    |    |    |    |
        "ttl": 1 * 24 * 60 * 60 * 1000 
    },
}