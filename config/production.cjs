module.exports = {

    /** 
     * log only errors
     */
    "pino": {
        "opts": {
            "level": "error"
        }
    },

    "cache": {
        "on": true
    },

    /** 
     * don't add debug info to results 
    **/
    "isDebug": false
}