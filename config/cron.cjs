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
        }
    },

    // zlogger options
    //
    "zlogger": {
        "level"     : "error",
        "transports": [ 'file' ],
    },

    // this overrides any test or development mode settings
    // 
    "mode"  : "real", 
    "server": {
        "hostname": 'https://tb.plazi.org',
        "path"    : 'dumps',
        "port"    : 443
    },
    "source": "archive"
}