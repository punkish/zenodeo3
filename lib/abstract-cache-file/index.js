'use strict'

/**
 * abstract-file-cache module
 * @module abstract-file-cache
 */

const fs = require('fs');
const fsPromises = fs.promises
const path = require('path')

const exists = (dir) => {
    try {
        fs.accessSync(dir)
    } 
    catch(error) {
        return false
    }

    return true
}

const makeCacheDir = (p) => {
    path.normalize(p)

    if (!exists(p)) {
        try {
            fs.mkdirSync(p)
        }
        catch (error) {
            if (error) throw error
        }
    }

    return p
}

const buildFilePath = (cacheDir, key) => {
    const p = path.normalize(`${cacheDir}/${key.substr(0, 1)}/${key.substr(0, 2)}/${key.substr(0, 3)}`)
    
    return { folder: p, file: `${key}.json` }
}

const checkValidity = (value) => {

    return new Promise(function(resolve, reject) {
        if (typeof(value) === 'string') {
            value = JSON.parse(value)
        }
        
        const until = value.stored + value.ttl
        if (until > Date.now()) {
            resolve(value)
        }
        else {
            resolve(false)
        }
    })
    
}

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

    // determine the location where the cache will be created
    const base = path.normalize(
        (

            // user-supplied value or
            config.base || 

            // directory from where the main program is called or '' or
            (require.main ? path.dirname(require.main.filename) : undefined) || 

            // current working directory
            process.cwd()
        ) + '/cache'
    )
    
    // the segment inside the cache. If the cache is analagous to a 
    // database, a segment is like a table in the db. There can be 
    // many segments in a cache
    const segment = config.segment    

    // a shadow memoryCache to speed things up. This is filled as 
    // values are requested or set
    const memoryCache = {}
    memoryCache[segment] = {}

    // duration the entire cache (all the keys) will live
    // defaults to 0 aka forever
    const duration = config.duration || 0

    // if `await` is set to false because abstract-cache-file 
    // uses callbacks instead of async/await
    const await = config.useAwait

    const cacheDir = makeCacheDir(`${base}/${segment}`)

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

    // const opts = {
    //     duration: duration,
    //     cacheDir: cacheDir,
    //     memoryCache: memoryCache,
    //     segment: segment
    // }

    const instance = Object.create({
    
        // The following are required by abstract-cache
    
        // if `await` is set to false abstract-cache-file 
        // uses callbacks instead of async/await
        //await: await,
    
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

            // check if the memoryCache has the key
            if (memoryCache[segment] && key in memoryCache[segment]) {
                const val = memoryCache[segment][key]
                return checkValidity(val)
            }
            else {
                const { folder, file } = buildFilePath(cacheDir, key)
                return fsPromises.readFile(`${folder}/${file}`, 'utf8')
            }  
        },

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
        set: (key, value, ttl, cb) => {
            const payload = {
                item: value,
                stored: Date.now(),
                ttl: ttl || duration
            }

            // always store in memory
            memoryCache[segment][key] = payload

            const { folder, file } = buildFilePath(cacheDir, key)

            fs.mkdir(folder, { recursive: true }, (err) => {
                if (err) return console.log(err)
                fs.writeFile(`${folder}/${file}`, JSON.stringify(payload), cb);
            });
            

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
            enumerable: true,
            value: true
        },
        file: {
          enumerable: false,
          value: {
            client: config.client,
          }
        },
        _segment: {
            enumerable: false,
            value: segment || 'abstractCacheFile'
        }
    })

    return instance
}