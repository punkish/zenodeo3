// this overrides any test or development mode settings

module.exports = {

    // log only errors
    // 
    "pino": {
        "opts": {
            "level": "error"
        }
    },
    
    // cron jobs output log only to file
    // 
    "truebug": {
        "log": {
            "transports": [ "file" ]
        }
    },

    "newbug": {
        "logger": {
            "transports": [ "file" ]
        },

        "action": "etl"
    },

    // zlogger options
    "zlogger": {
        "level"     : "error",
        "transports": [ 'file' ],
    },

    
    "mode"  : "real", 
    "server": {
        "hostname": 'https://tb.plazi.org',
        "path"    : 'dumps',
        "port"    : 443
    },
    "source": "tb"
}