module.exports = {

    /**
     * cron jobs output log only to file
    **/
    "truebug": {
        "log": {
            "transports": [ "file" ]
        }
    },

    /**
     * this overrides any test or dev settings in 
     * development mode
    **/
    "runMode": "real", 
    "server": "https://tb.plazi.org/dumps",
    "source": "archive"
}