module.exports = {

    /**
     * cron jobs output log only to file
     */
    "truebug": {
        "log": {
            "transports": [ "file" ]
        }
    },

    /**
     * this overrides any test or dev settings in 
     * development mode
     */
    "runMode": "real", 
    "server": {
        "hostname": 'https://tb.plazi.org',
        "path": 'dumps',
        "port": 443
    },
    "source": "archive"
}