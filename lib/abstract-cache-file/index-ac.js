'use strict'

/**
 * abstract-cache-file
 * @module abstract-cache-file
 */

const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
const pino = require('pino')
const logger = pino({
    prettyPrint: true,
    level: 'info',
    name: 'ACF'
})

const { getBase, buildFilePath, isFresh, makeCacheDir } = require('./utils')

/**
 * Export a factory function (optionsObject) {}
 * @author Puneet Kishor <github.com/punkish>
 * @param {Object} config - config params for the cache
 * @param {string} config.base - The location where the cache will be created.
 * @param {string} config.segment - The segment inside the cache.
 * @param {integer} config.duration - The duration of the cache – defaults to 0.
 * @param {boolean} config.await - useAwait or callback – defaults to false.
 */
module.exports = function abstractCacheFileFactory (config) {
    const _config = config || {}
    //if (!_config.client) throw Error('abstract-cache-file: invalid configuration')

    // determine the location where the cache will be created
    const base = getBase(_config.base)
    const client = _config.client

    // the segment inside the cache. If the cache is analagous to a 
    // database, a segment is like a table in the db. There can be 
    // many segments in a cache
    const segment = _config.segment || 'abstractCacheFile'

    const cacheDir = makeCacheDir(`${base}/${segment}`)

    // duration the entire cache (all the keys) will live
    // defaults to 0 aka forever
    const duration = config.duration || 0

    // a shadow memoryCache to speed things up. This is filled as 
    // values are requested or set
    const memoryCache = {}
    memoryCache[segment] = {}

    const instance = Object.create({

        // The following are required by abstract-cache
    
        // delete(key[, callback]): removes the specified item 
        // from the cache
        delete: function (key) {
            delete memoryCache[segment][key]
    
            const { folder, file } = buildFilePath(cacheDir, key)
            return fsPromises.unlink(`${folder}/${file}`)
        },
    
        // get(key[, callback]): retrieves the desired item from 
        // the cache. The returned item should be a deep copy of 
        // the stored value to prevent alterations from 
        // affecting the cache. The result should be an object 
        // with the properties:
        //    item: the item the user cached.
        //    stored: a Date, in Epoch milliseconds, 
        //            indicating when the item was stored.
        //    ttl: the remaining lifetime of the item in 
        //         the cache (milliseconds).
        get: (key) => {
            const { folder, file } = buildFilePath(cacheDir, key)
            return fsPromises.readFile(`${folder}/${file}`, 'utf8')
        },
    
        // https://gist.github.com/lovasoa/8691344#gistcomment-3332345
        // const has = async function* (dir) {
        //     for await (const d of await fs.promises.opendir(dir)) {
        //         const entry = path.join(dir, d.name)
        //         if (d.isDirectory()) {
        //             yield* await has(entry)
        //         }
        //         else if (d.isFile()) {
        //             yield entry
        //         }
        //     }
        // }
        has: (key) => {
    
            // check if the memoryCache has the key
            if (memoryCache[segment] && key in memoryCache[segment]) {
                const val = memoryCache[segment][key]
                return checkValidity(val)
            }
            else {
                const { folder, file } = buildFilePath(cacheDir, key)
                return fsPromises.readFile(`${folder}/${file}`, 'utf8')
                    .then((result) => Boolean(result))
                    .catch((error) => Boolean(false))
            } 
        },
    
        // set(key, value, ttl[, callback]): stores the 
        // specified value in the cache under the 
        // specified key for the time ttl in ms
        set: (key, value, ttl) => {
            if (ttl !== 0) {
                logger.info('storing queried data')
                const payload = JSON.stringify({
                    item: value,
                    stored: Date.now(),
                    ttl: ttl || duration
                })
        
                const { folder, file } = buildFilePath(cacheDir, key)
                return fsPromises.mkdir( folder, { recursive: true } )
                    .then(() => {
                        return fsPromises.writeFile(`${folder}/${file}`, payload)
                    })
                    .catch((error) => { throw error })
            }
            else {
                logger.info('not caching data because ttl is 0')
            }
        },
    
        // the following is optional from the point of abstract-cache
        // but is provided as inherited from persistent-cache. Based
        // on code from the following gist
        // https://gist.github.com/lovasoa/8691344#gistcomment-3332345
        keys: (foo) => {
            
            //const _key = mapKey(pattern, this._segment)
            const rd = (dir) => {
                return fsPromises.readdir(dir)
                    .then((entries) => {
                        const foo = entries.map(entry => {
                            const newpath = path.join(dir, entry)
                            return fsPromises.stat(newpath)
                                .then((stats) => {
                                    if (stats.isDirectory()) {
                                        return rd(newpath)
                                    }
                                    else if (stats.isFile()) {
                                        if (entry.endsWith('.json')) {
                                            return(entry.slice(0, -5))
                                        }
                                    }
                                })
                        })
    
                        return Promise.all(foo)
                            .then((f) => {
                                f.reduce((all, f) => all.concat(f), [])
                                return f.flat()
                            })
                    })
            }
    
            return rd(cacheDir)
            
        }
    })
    
    Object.defineProperties(instance, {
        await: {
            enumerable: false,
            value: true
        },
        _file: {
            enumerable: false,
            value: client
        },
        _segment: {
            enumerable: false,
            value: segment
        }
    })

    return instance
}