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
     * this overrides any test or development mode settings
     */
    "runMode": "real", 
    "server": {
        "hostname": 'https://tb.plazi.org',
        "path": 'dumps',
        "port": 443
    },
    "source": "archive"
}