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

    // this overrides any test or development mode settings
    // 
    "mode"  : "real", 
    "server": {
        "hostname": 'https://tb.plazi.org',
        "path"    : 'GgServer/dumps',
        "port"    : 443
    },
    "source": "archive"
}