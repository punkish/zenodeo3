const path = require('path');
const cwd = process.cwd();
const dataDir = path.join(cwd, 'data');

module.exports = {

    /**
     * the 'port' and the 'address' are where this 
     * service runs, and the 'url' is where this 
     * service is available from outside
     */
    "port": 3010,
    "address": "127.0.0.1",
    "schemes": [ "http" ],
    "url": {
        "zenodeo": "http://127.0.0.1:3010",
        "swagger": "127.0.0.1:3010",
        "zenodo": "https://zenodo.org/api/records"
    },

    /**
     * logger options 
     */ 
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
             */
            "removeAdditional": false,
            "useDefaults": true,

            /** 
             * coerceTypes -> "array" ensures the scalar values are 
             * coerced to their proper types, for example, strings to
             * numbers, and single values are coerced to arrays
             */
            "coerceTypes": "array",
            "allErrors": true
        }
    },

    /** 
     * add debug info to results 
     */ 
    "isDebug": true,
    "useGot": false,

    "dataDir": "data",

    /**
     * separate databases, one for each table, all stored within 
     * a single 'z3' directory. The databases are ATTACHed before use
     */
    "db": {
        "main": {
            "z3": path.join(dataDir, 'z3', 'z3.sqlite')
        },
        "attached": {
            "tr": path.join(dataDir, 'z3', 'attached', 'treatments.sqlite'),
            "ti": path.join(dataDir, 'z3', 'attached', 'treatmentimages.sqlite'),
            "ta": path.join(dataDir, 'z3', 'attached', 'treatmentauthors.sqlite'),
            "tc": path.join(dataDir, 'z3', 'attached', 'treatmentcitations.sqlite'),
            "mc": path.join(dataDir, 'z3', 'attached', 'materialcitations.sqlite'),
            "fc": path.join(dataDir, 'z3', 'attached', 'figurecitations.sqlite'),
            "bc": path.join(dataDir, 'z3', 'attached', 'bibrefcitations.sqlite'),
            "gb": path.join(dataDir, 'z3', 'attached', 'gbifcollections.sqlite'),
            "fa": path.join(dataDir, 'z3', 'attached', 'facets.sqlite')
        }
    },

    "cache": {
        "on": true,
        "base": path.join(cwd, 'cache'),

        /** 
         * set default cache duration to 1 day
         */ 
        "ttl": 1 * 24 * 60 * 60 * 1000 
    },

    "truebug": {
        "log": {
            "level": "info",
            "transports": [ 'console', 'file' ],
            "dir": path.join(cwd, 'bin/truebug/logs')
        },

        //"runMode": 'test', // simulated
        "runMode": 'real',   // real data

        /**
         * server where the data are stored 
         */
        // "server": {
        //     "hostname": 'http://127.0.0.1',
        //     "path": 'plazi/data',
        //     "port": 80
        // },
        "server": {
            "hostname": 'https://tb.plazi.org',
            "path": 'dumps',
            "port": 443
        },

        "source": "archive",
        //"source": "xml",

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
         */
        "download": {

            // example: 'http://127.0.0.1/plazi/data/plazi.zenodeo.zip'
            // example: 'https://tb.plazi.org/plazi.zenodeo.zip'
            "full": 'plazi.zenodeo.zip',
            "monthly": 'plazi.zenodeo.monthly.zip',
            "weekly": 'plazi.zenodeo.weekly.zip',
            "daily": 'plazi.zenodeo.daily.zip',

            // "xml": "03FC87E61268FFD6D3E36CD2FE12DF29",
            // "xml": "BF8A576EC3F6661E96B5590C108213BA",
            // "xml": "0247B450A734FFD280E97BD0FA9FFA55",
            // "xml": "BF83FD94E0CDA346729786FC4E1CBDB9",
            // "xml": "BF87E6B3C70B5DA7BFE7958FCE167A46",
            "xml": "00078788D744DE18E88B8B8BFE7FDBF9",
        },

        "dirs": {
            "data"   : dataDir,
            "dumps"  : path.join(dataDir, 'treatments-dumps'),
            "full"   : path.join(dataDir, 'treatments-dumps', 'full'),
            "monthly": path.join(dataDir, 'treatments-dumps', 'monthly'),
            "weekly" : path.join(dataDir, 'treatments-dumps', 'weekly'),
            "daily"  : path.join(dataDir, 'treatments-dumps', 'daily'),
            "singles": path.join(dataDir, 'treatments-dumps', 'singles'),
            "old"    : path.join(dataDir, 'treatments-dump-old'),
            "archive": path.join(dataDir, 'treatments-archive'),
            "zips"   : path.join(dataDir, 'zips'),
            "z3"     : path.join(dataDir, 'z3')
        },

        "steps": {
            "main": {
                "printStack": false
            },
            "preflight": {
                "checkDir"        : true,
                "backupOldDB"     : true,
                "copyXmlToDump"   : true,
                "filesExistInDump": true
            },
            "download": {
                "checkRemote": true,
                "download"   : true,
                "unzip"      : true
            },
            "database": {
                "storeMaxrowid"       : false,
                "dropIndexes"         : true,
                "insertFTS"           : true,
                "insertDerived"       : true,
                "updateIsOnLand"      : true,
                "buildIndexes"        : true,
                "createTriggers"      : true,
                "getLastUpdate"       : true,
                "insertStats"         : true,
                "repackageTreatment"  : true,
                "insertData"          : true,
                "resetData"           : true,
                "getCounts"           : true,
                "getArchiveUpdates"   : true,
                "selCountOfTreatments": true
            },
            "parse": {
                "parseOne" : true,
                "calcStats": true
            },
            "postflight": {
                "cpFile": true,
                "rmFile": true
            }
        }
    }
}