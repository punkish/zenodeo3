'use strict'

const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
const log = require('../utils')('ACF')
const cacheDir = './tmp'
const duration = 24 * 60 * 60 * 1000

const buildFilePath = (key) => {   
    return { 
        folder: path.normalize(`${cacheDir}/${key.substr(0, 1)}/${key.substr(0, 2)}/${key.substr(0, 3)}`), 
        file: `${key}.json` 
    }
}

const isFresh = (value) => {
    if (typeof(value) === 'string') {
        value = JSON.parse(value)
    }
    
    let res = false
    if (value.ttl === 'Infinity') {
        res = true
    }
    else {
        if ((value.stored + value.ttl) > Date.now()) {
            res = true
        }
    }

    return res
}

const get = (key) => {
    const { folder, file } = buildFilePath(key)
    return fsPromises.readFile(`${folder}/${file}`, 'utf8')
        .then((data) => {
            return isFresh(data) ? data : false
        })
}

const set = (key, value, ttl) => {
    if (ttl !== 0) {
        const payload = JSON.stringify({
            item: value,
            stored: Date.now(),
            ttl: ttl || duration
        })

        const { folder, file } = buildFilePath(key)
        return fsPromises.mkdir( folder, { recursive: true } )
            .then(() => {
                return fsPromises.writeFile(`${folder}/${file}`, payload)
            })
            .catch((error) => { throw error })
    }
}

const data = [
    { 
        key: '0A2f32343df3f3df3564FKG6R4GAF4H',
        value: "this won't be cached because ttl is zero",
        ttl: 0
    },
    {
        key: '7842343SG4FJKF3564TDHX437FH85B7',
        value: 'this is the right one but lives for only 5 seconds',
        ttl: 5000
    },
    {
        key: 'C34DJG647VJGH78THN7BDD35VBB6FG6',
        value: 'boom! ttl for 1 minute',
        ttl: 60 * 1000
    },
    {
        key: 'EREWX757GBH7UBKJC6V5577DBNF5FNV',
        value: 'also boom because ttl is not prescribed so it will be set to the default cache ttl which is a day'
    },
    {
        key: 'WRXF477FN7YGJVXD5DJ7VVS34DG7F6C',
        value: 'this will be cached forever',
        ttl: 'Infinity'
    }
]

const send = (data) => {
    log.info(data)
}

const query = (id) => {
    return data[id]
}

const id = 2
get(data[id].key)
    .then((data) => {
        if (data) {
            log.info('found in cache and still fresh')
            send(JSON.parse(data))
        }
        else {
            log.info('found in cache but stale')
            log.info('querying for fresh data')
            const data = query(id)
            log.info('storing in cache')
            set(data.key, data.value, data.ttl)
                .then(() => {
                    const payload = {
                        item: data.value,
                        stored: Date.now(),
                        ttl: data.ttl || duration
                    }

                    log.info('successfully stored 2')
                    send(payload)
                })
                .catch((error) => {
                    log.info(error)
                })
        }
    })
    .catch((error) => {
        log.info(error)

        set(data[id].key, data[id].value, data[id].ttl)
            .then(() => {
                const payload = {
                    item: data[id].value,
                    stored: Date.now(),
                    ttl: data[id].ttl || duration
                }

                log.info('successfully stored 1')
                send(payload)
            })
            .catch((error) => {
                log.info(error)
            })
    })
