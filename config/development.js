export const development = {
    "port": 3010,
    "address": "0.0.0.0",
    "url": {
        "zenodeo": "http://127.0.0.1:3010/v3",
        "zenodo": "https://zenodo.org/api/records"
    },
    "pino": {
        "opts": {
            "prettyPrint": true,
            "level": "info"
        }
    },
    "isDebug": true
}