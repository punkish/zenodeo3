import * as path from 'path';
const cwd = process.cwd();
const dataDir = path.join(cwd, '..', 'data');

export const development = {
    "port": 3010,
    "address": "0.0.0.0",
    "url": {
        "zenodeo": "http://127.0.0.1:3010",
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
            "customOptions": {

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
                "allErrors": false
            }
        }
    },

    /** 
     * add debug info to results 
     */ 
    "isDebug": true,

    "db": {
        "treatments": path.join(dataDir, 'z3-treatments.sqlite'),
        "gbifcollections": path.join(dataDir, 'z3-gbifcollections.sqlite'),
        "facets": path.join(dataDir, 'z3-facets.sqlite'),
        "stats": path.join(dataDir, 'z3-stats.sqlite')
    },

    "cache": {
        "on": false,
        "base": path.join(cwd, 'cache'),

        /** 
         * set default cache duration to 7 days
         */ 
        "ttl": 7 * 24 * 60 * 60 * 1000 
    }
}