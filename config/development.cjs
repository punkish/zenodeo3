const path = require('path');
const cwd = process.cwd();
const dataDir = path.join(cwd, '..', 'data');

module.exports = {

    /**
     * the 'port' and the 'address' are where this 
     * service runs, and the 'url' is where this 
     * service is available from outside
    **/
    "port": 3010,
    "address": "0.0.0.0",
    "url": {
        "zenodeo": "http://127.0.0.1:3010",
        "zenodo": "https://zenodo.org/api/records"
    },

    /**
     * logger options 
    **/ 
    "pino": {
        "opts": {
            "transport": {
                "target": "pino-pretty",
                "options": {
                    "translateTime": "HH:MM:ss Z",
                    "ignore": "pid,hostname"
                }
            },
            "level": "info"
        }
    },

    "ajv": {
        "opts": {

            /** 
             * removeAdditional -> false ensures the server croaks
             * when the user sends unspecific k,v pairs in the query
            **/
            "removeAdditional": false,
            "useDefaults": true,

            /** 
             * coerceTypes -> "array" ensures the scalar values are 
             * coerced to their proper types, for example, strings to
             * numbers, and single values are coerced to arrays
            **/
            "coerceTypes": "array",
            "allErrors": true
        }
    },

    /** 
     * add debug info to results 
    **/ 
    "isDebug": true,
    "useGot": false,

    "db": {
        "treatments-testing": path.join(dataDir, 'treatments-testing.sqlite'),
        "treatments": path.join(dataDir, 'z3-treatments.sqlite'),
        "gbifcollections": path.join(dataDir, 'z3-gbifcollections.sqlite'),
        "facets": path.join(dataDir, 'z3-facets.sqlite'),
        "stats": path.join(dataDir, 'z3-stats.sqlite')
    },

    "cache": {
        "on": true,
        "base": path.join(cwd, 'cache'),

        /** 
         * set default cache duration to 7 days
        **/ 
        "ttl": 7 * 24 * 60 * 60 * 1000 
    },

    "truebug": {
        "log": {
            "level": 'info',
            "transports": [ 'console', 'file' ],
            "dir": path.join(cwd, 'bin/truebug/logs')
        },

        // run: 'test', // test data (small sample ~10K records)
        "run": 'real', // real data
        //run: 'dry',     // simulated run, no commands executed

        /**
         * server where the data are stored 
        **/
        // "server": 'http://127.0.0.1/plazi/data',
        "server": "https://tb.plazi.org/dumps",

        //source: 'full',
        //source: 'monthly',
        // source: 'weekly',
        "source": 'daily',
        //source: 'single',

        /**
         * by default, download the daily dump, and then go to
         * the larger ones if a smaller one doesn't exist:
         *  - if plazi.zenodeo.daily.zip exists => use it
         *  - else if plazi.zenodeo.weekly.zip exists => use it
         *  - else if plazi.zenodeo.monthly.zip exists => use it
         *  - else use plazi.zenodeo.zip
         * 
         * The full dump is packed once a year now
         * The monthly dump is packed on the first Sunday of the month
         * The weekly dump is packed every Sunday
         * The daily dump is packed every day
        **/
        "download": {

            // example: 'http://127.0.0.1/plazi/data/test.zip'
            "full": 'plazi.zenodeo.zip',
            "monthly": 'plazi.zenodeo.monthly.zip',
            "weekly": 'plazi.zenodeo.weekly.zip',
            "daily": 'plazi.zenodeo.daily.zip',

            // "single": "03FC87E61268FFD6D3E36CD2FE12DF29",
            // "single": "BF8A576EC3F6661E96B5590C108213BA",
            // "single": "0247B450A734FFD280E97BD0FA9FFA55",
            // "single": "BF83FD94E0CDA346729786FC4E1CBDB9",
            // "single": "BF87E6B3C70B5DA7BFE7958FCE167A46",
            "single": "00078788D744DE18E88B8B8BFE7FDBF9",
        },

        "dirs": {
            "data"   : dataDir,
            "dump"   : path.join(dataDir, 'treatments-dump'),
            "old"    : path.join(dataDir, 'treatments-dump-old'),
            "archive": path.join(dataDir, 'treatments-archive')
        }
    }
}