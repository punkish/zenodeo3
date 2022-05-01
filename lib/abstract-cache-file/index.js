'use strict'

/**
 * abstract-cache-file
 * @module abstract-cache-file
 */

const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
//const JSON5 = require('json5');
const log = require('../../lib/utils').logger('ACF');

const existsSync = (dir) => {
    try {
        fs.accessSync(dir);
    } 
    catch(error) {
        return false;
    }

    return true;
}

const exists = (file) => {
    return fsPromises.access(file, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);
  }

const makeCacheDir = (p) => {
    path.normalize(p)

    if (!existsSync(p)) {
        try {
            fs.mkdirSync(p);
        }
        catch (error) {
            if (error) throw error;
        }
    }

    return p;
}

const buildFilePath = (cacheDir, key) => {
    return { 
        folder: path.normalize(`${cacheDir}/${key.substr(0, 1)}/${key.substr(0, 2)}/${key.substr(0, 3)}`), 
        file: `${key}.json` 
    }
}

const isFresh = (response) => {    
    if (response.ttl === 'Infinity') {
        log.info('isFresh() -> data is fresh forever');
        return true;
    }
    
    const now = Date.now();
    const life = response.ttl + response.stored;
    const ttl = life - now;
    if (life > now) {
        log.info('isFresh() -> data is fresh');
        response.ttl = ttl;
        return true;
    }

    log.info('isFresh() -> data is stale');
    return false;
}

const getBase = (base) => {
    const progdir = require.main ? path.dirname(require.main.filename) : undefined;
    const p = base || progdir || process.cwd();
    return path.normalize(p) + '/cache';
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
    const _config = config || {};

    // determine the location where the cache will be created
    const base = getBase(_config.base);

    // the segment inside the cache. If the cache is analagous to a 
    // database, a segment is like a table in the db. There can be 
    // many segments in a cache
    const segment = _config.segment || 'abstractCacheFile';
    const cacheDir = makeCacheDir(`${base}/${segment}`);

    const instance = Object.create({

        // The following are required by abstract-cache
    
        // delete(key[, callback]): removes the specified item 
        // from the cache
        delete: async function (key) {    
            const { folder, file } = buildFilePath(cacheDir, key);

            if (exists(`${folder}/${file}`)) {
                try {
                    return await fsPromises.unlink(`${folder}/${file}`);
                }
                catch(error) {
                    log.info(error);
                }
            }
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
        get: async (key) => {
            const { folder, file } = buildFilePath(cacheDir, key)
            //return  fsPromises.readFile(`${folder}/${file}`, 'utf8')
            let cachedEntry;

            try {
                cachedEntry = await fsPromises.readFile(`${folder}/${file}`, 'utf8');
            }

            // there is no data in the cache so log the error
            // and continue on
            catch (error) {
                log.error(`${error.code === 'ENOENT' ? 'no data in cache' : error}`);
                return false;
            }

            //const response = JSON5.parse(cachedEntry);
            const response = JSON.parse(cachedEntry);
            if (isFresh(response)) {
                return response;
            }
            
            return false;
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
            const { folder, file } = buildFilePath(cacheDir, key);
            return fsPromises.readFile(`${folder}/${file}`, 'utf8')
                .then((result) => Boolean(result))
                .catch((error) => Boolean(false))
        },

        // val is { item, stored, ttl }
        set: async (key, val) => {
            if (val.ttl) {

                let madeDir = false
                const { folder, file } = buildFilePath(cacheDir, key)
                try {
                    await fsPromises.mkdir( folder, { recursive: true } )
                    madeDir = true
                }

                // something went wrong making the directory
                catch (error) {
                    
                    // log the error but continue on so the client
                    // still gets something
                    log.error(error)
                }

                if (madeDir) {

                    // write the data
                    try {
                        //await fsPromises.writeFile(`${folder}/${file}`, JSON5.stringify(val))
                        await fsPromises.writeFile(`${folder}/${file}`, JSON.stringify(val));
                    }

                    // something went wrong writing the file
                    catch (error) {
                        
                        // log the error but continue on so the client
                        // still gets something
                        log.error(error)
                    }
                }
            }
            else {
                log.error('cached value should have a ttl');
                return false;
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
    
            return rd(cacheDir);
        }
    })

    return instance
}