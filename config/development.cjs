const path = require('path');
const cwd = process.cwd();
const dataDir = path.join(cwd, 'data');

module.exports = {

    // the 'port' and the 'address' are where this service runs, and the 'url' 
    // is where this service is available from outside
    //
    "port": 3010,
    "address": "0.0.0.0",
    "schemes": [ "http" ],
    "url": {
        "zenodeo": "http://0.0.0.0:3010",
        "swagger": "0.0.0.0:3010",
        "zenodo" : "https://zenodo.org/api/records"
    },

    // logger options 
    //
    "pino": {
        "opts": {
            "transport"  : {
                "target" : "pino-pretty",
                //target: 'pino/file',
                "options": {
                    destination: 1, // this writes to STDOUT
                    colorize: true,
                    "translateTime": "HH:MM:ss Z",
                    "ignore"       : "pid,hostname"
                }
            },
            "level": "error",
            serializers: {

                // The default value response
                // res (reply) {
                //   return {
                //     statusCode: reply.statusCode
                //   }
                // },
                req (request) {

                    // Including the headers in the log could be in 
                    // violation of privacy laws, e.g. GDPR. You should use 
                    // the "redact" option to remove sensitive fields. It 
                    // could also leak authentication data in the logs.
                    return {
                        //method: request.method,
                        url: request.url,
                        // path: request.routerPath,
                        // parameters: request.params,
                        //headers: request.headers
                    };
                }
            }
        }
    },

    // zlogger options
    "zlogger": {
        "level"     : "info",
        "transports": [ 'console' ],
        "dir"       : path.join(cwd, 'logs'),

        // Use timestamp only, no dates
        "tsType"    : "timeonly"
    },

    "ajv": {
        "opts": {

            // removeAdditional -> false ensures the server croaks when the 
            // user sends unspecific k,v pairs in the query
            //
            "removeAdditional": false,
            "useDefaults"     : true,

            // coerceTypes -> "array" ensures the scalar values are coerced to 
            // their proper types, for example, strings to numbers, and single 
            // values are coerced to arrays
            //
            "coerceTypes": "array",
            "allErrors"  : true
        }
    },

    // add debug info to results 
    //
    "isDebug": true,
    "useGot": false,

    // This is where the db is stored
    //
    "dataDir": "data/db",


    // page=1&size=30&class=Arachnida&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption&cols=latitude&cols=longitude&yearlyCounts=true
    "cronQueries": {
        "runCronJobsOnStart": false,
        "installCronJobs": false,
        "params": {
            "images": [ 
                "treatmentId", "treatmentTitle", "zenodoDep", "treatmentDOI", 
                "articleTitle", "articleAuthor", "httpUri", "caption", 
                "latitude", "longitude"
            ],
            "treatments": [ 
                "treatmentId", "treatmentTitle", "zenodoDep", "treatmentDOI", 
                "articleTitle", "articleAuthor", "journalTitle", "latitude",
                "longitude"
            ],
            "species": []
        },

        "queries" : [
            '',
            `family=Formicidae`,
            `class=Actinopterygii`,
            `class=Arachnida`,
            `class=Malacostraca`,
            `order=Coleoptera`,
            `captionText=phylogeny`,
            `q=phylogeny&termFreq=true`,
            `q=phylogeny AND plantae`,
            `journalTitle=eq(European Journal of Taxonomy)`,
            `articleDOI=10.11646/zootaxa.5284.3.7`,
            `articleTitle=starts_with(Morphology and taxonomic assessment)`,
            `geolocation=within(radius:10,units:'kilometers',lat:40.21,lng:-120.33)`,
            `class=Actinopterygii&publicationDate=since(2021-12-21)`,
            `checkinTime=since(yesterday)`,
            `q=tyrannosaurus&authorityName=Osborn`,
            `family=Agamidae`,
            `q=moloch OR horridus`,
            `q=decapoda&journalTitle=not_like(zootaxa)`,
            `biome=savanna`,
            `biome=veld`,
            `biome=pampas`,
            `biome=Tundra`,
            `biome=Tropical and Subtropical Moist Broadleaf Forests`,
            `biome=Mediterranean Forests, Woodlands and Scrub`,
            `biome=Deserts and Xeric Shrublands`,
            `biome=Temperate Grasslands, Savannas and Shrublands`,
            `biome=Boreal Forests or Taiga`,
            `biome=Temperate Conifer Forests`,
            `biome=Temperate Broadleaf and Mixed Forests`,
            `biome=Montane Grasslands and Shrublands`,
            `biome=Mangroves`,
            `biome=Flooded Grasslands and Savannas`,
            `biome=Tropical and Subtropical Grasslands, Savannas and Shrublands`,
            `biome=Tropical and Subtropical Dry Broadleaf Forests`,
            `biome=Tropical and Subtropical Coniferous Forests`
        ]
    },

    "cache": {
        "on"  : true,
        "base": path.join(cwd, 'cache'),

        //  
        // set default cache duration to 1 days
        //  
        //     +------------------------- days
        //     |    +-------------------- hours
        //     |    |    +--------------- mins
        //     |    |    |    +---------- secs
        //     |    |    |    |    +----- ms
        //     |    |    |    |    |
        "ttl": 1 * 24 * 60 * 60 * 1000 
    },

    "truebug": {
        "log": {
            "level"     : "info",
            "transports": [ 'console', 'file' ],
            "dir"       : path.join(cwd, 'bin/truebug/logs')
        },

        //"mode": 'dryRun',  // simulated
        //"mode": "test",    // real data but only 15 files
        "mode": "real",      // real data

        // server where the data are stored 
        // 
        // "server": {
        //     "hostname": 'http://127.0.0.1',
        //     "path"    : 'plazi/data',
        //     "port"    : 80
        // },
        "server": {
            "hostname": 'https://tb.plazi.org',
            "path"    : 'dumps',
            "port"    : 443
        },

        "source": "archive",
        //"source": "xml",

        // by default, download the daily dump, and then go to
        // the larger ones if a smaller one doesn't exist:
        //  - if plazi.zenodeo.daily.zip exists => use it
        //  - else if plazi.zenodeo.weekly.zip exists => use it
        //  - else if plazi.zenodeo.monthly.zip exists => use it
        //  - else use plazi.zenodeo.zip
        // 
        // The full dump is packed once a year now
        // The monthly dump is packed on the first Sunday of the month
        // The weekly dump is packed every Sunday
        // The daily dump is packed every day
        // 
        "archives": {

            // example: 'http://127.0.0.1/plazi/data/plazi.zenodeo.zip'
            // example: 'https://tb.plazi.org/GgServer/dumps/plazi.zenodeo.zip'
            "yearly" : "plazi.zenodeo",
            "monthly": "plazi.zenodeo.monthly",
            "weekly" : "plazi.zenodeo.weekly",
            "daily"  : "plazi.zenodeo.daily",

            // "xml": "03FC87E61268FFD6D3E36CD2FE12DF29",
            // "xml": "BF8A576EC3F6661E96B5590C108213BA",
            // "xml": "0247B450A734FFD280E97BD0FA9FFA55",
            // "xml": "BF83FD94E0CDA346729786FC4E1CBDB9",
            // "xml": "BF87E6B3C70B5DA7BFE7958FCE167A46",
            // "xml": "00078788D744DE18E88B8B8BFE7FDBF9",

            // lots of bibRefCitations, but no materialCitations
            //
            // "xml": "000A3347FFAF4419F859F8B6FBF4A3AA"

            // "xml": "000A3347FFAF441BF83EFBDEFEB7A7AB"

            // several collectionCodes, hence materialCitations
            //
            // "xml": "0004878BCE1AD075FF58FEB0F351FD28",
            // "xml": "0006D73C47719603931CCE694A14DA4A",
            // "xml": "0006D73C47719603931CCE694A14DA4A",
            // "xml": "00102209FFDBFFC5FF40432DFA78FE38",
            // "xml": "001E1309FFA0FFF8FF1EFC6F228DF968",
            // "xml": "001E1309FFA0FFF8FF1FFE1621D0FCF4",
            // "xml": "001E1309FFA0FFF8FF1FFE1621D0FCF4",   
            // "xml": "001E1309FFA0FFFBFF1FF8D627AEFEE7",
            // "xml": "001E1309FFA1FFF8FF1EF90C274FFE2F",
            // "xml": "001E1309FFA1FFF8FF1EF90C274FFE2F",

            // bad collection codes
            //
            // "xml": "877687BAFF89DD03AB23E36C6568FAF3",

            // several treatmentCitations
            //
            //"xml": "000587EFFFADFFC267F7FAC4351CFBC7"
            // "xml": "00102209FF8AFF94FF404169FF3EFC17"

            // "xml": "000040332F2853C295734E7BD4190F05"

            // problematic figureCitation
            //
            // "xml": "038287ACFFFEFFAEFF7639DB6A45F97A"
            // "xml": "038187AEFFABFFE9E8CE23C2FDCBFE6C",
            // "xml": "000087F6E320FF99FDC9FA73FA90FABE",
            // "xml": "000087F6E320FF99FDC9FA73FA90FABE"

            // takes a long time
            //
            // "xml": "7EF1B844B6845777A5D50518D27AC513"

            // problematic journalTitle (EJT)
            //
            //"xml": "5C7987C4FFC0FFDCECF6F9FB34B5FD3F"

            // problematic figures and plates
            //
            "xml": "039C87AE7D51FFEEFF4707CF75ABFBF1"
            
        },

        "dirs": {
            "data"   : dataDir,
            "dumps"  : path.join(dataDir, 'treatments-dumps'),
            "old"    : path.join(dataDir, 'treatments-dump-old'),
            "archive": path.join(dataDir, 'treatments-archive'),
            "zips"   : path.join(dataDir, 'zips'),
            "z3"     : path.join(dataDir, 'z3')
        },

        "steps": {
            "main": {
                "printStats": true,
                "printStack": true
            },
            "preflight": {
                "checkDir"        : true,
                "backupOldDB"     : false,
                "copyXmlToDump"   : true,
                "filesExistInDump": true
            },
            "download": {
                "checkRemote": true,
                "download"   : true,
                "unzip"      : true
            },
            "database": {
                "dropIndexes"         : true,
                "buildIndexes"        : true,
                "analyzeDb"           : true,
                "getLastUpdate"       : true,
                "insertStats"         : true,
                "insertTreatments"    : true,
                "insertTreatmentJSONs": false,
                "getCounts"           : true,
                "getArchiveUpdates"   : true,
                "selCountOfTreatments": true
            },
            "parse": {
                "parseOne" : true,
                "calcStats": true,
                "cleanText": true,
                "calcIsOnLand": false,
                "_parseTreatmentCitations": true,
                "_parseTreatmentAuthors": true,
                "_parse": true,
                "_parseBibRefCitations": true,
                "_parseFigureCitations": true,
                "_parseCollectionCodes": true,
                "_parseMaterialCitations": true,
                "_parseTreatment": true,
                "_cheerioparse": true
            },
            "postflight": {
                "cpFile": false,
                "rmFile": false
            }
        }
    }
}