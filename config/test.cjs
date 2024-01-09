module.exports = {
    "schemes": [ "https" ],
    "url": {
        "zenodeo": "test.zenodeo.org",
        "swagger": "test.zenodeo.org"
    },

    "cache": {
        "on": true,

        /** 
         * set default cache duration to 7 days
         */ 
        "ttl": 1 * 24 * 60 * 60 * 1000 
    },
}