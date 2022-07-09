export const development = {
    "port": 3010,
    "address": "0.0.0.0",
    "url": {
        "zenodeo": "http://127.0.0.1:3010/v3",
        "zenodo": "https://zenodo.org/api/records"
    },

    "cacheOn": true,

    // logger options
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

    // add debug info to results
    "isDebug": true
}