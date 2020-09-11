'use strict'

// "abstract-cache-file": "file:/Users/punkish/Projects/abstract-cache-file",

const chance = require('chance').Chance()
const acf = require('./lib/abstract-cache-file')
const await = true
const acfOpts = {
    base: '',
    segment: 'treatments',
    duration: 1000 * 3600 * 24,
    await: await
}

const cache = require('abstract-cache')({
    useAwait: await,
    client: acf(acfOpts)
})


const data = [
    { 
        key: '0A2f32343df3f3df3',
        value: 'this is a wrong one',
        ttl: null
    },
    {
        key: '7842343df3f3df3',
        value: 'this is the right one but too short',
        ttl: 100
    },
    {
        key: 'C342343df3f3df3',
        value: 'boom',
        ttl: 86400000
    }
]

const after = {
    keys: (d) => console.log('KEYS', d),
    get: (d) => console.log('GET', d ? d : 'not found'),
    set: (d) => {
        return new Promise((resolve, reject) => {
            return console.log('SET', (d ? `failed to write because: ${d}`: 'wrote ') + data[2].key)
        })
    },
    has: (d) => console.log('HAS', d ? 'found' : 'not found'),
    delete: (d) => console.log('DEL', d ? `failed to delete: ${d}` : 'deleted'),
}

if (await) {
    // async function doset() {
    //     const d = await cache.get(data[2].key)
    //     console.log('SET and then GET', d ? `wrote ${JSON.stringify(d)}` : `failed to write ${data[2].key}`)
    // }

    // cache.set(data[2].key, data[2].value, data[2].ttl)
    //     .then(doset)
    //     .catch(console.error)

    // async function doget() {
    //     const d = await cache.get(data[2].key)
    //     console.log(`GET ${data[2].key}:`, d ? d : `failed to get ${data[2].key}`)
    // }
    // doget()
    const query = (key) => {
        return `some result for ${key}`
    }

    let newkey = chance.guid()
    newkey = 'e7023c8d-62cb-5a0a-a1c0-85358ef8f9f3'
    cache.get(newkey)
        .then((v) => console.log(`cached v: ${v}`))
        .catch((error) => {
            if (error) {
                const data = query(newkey)
                cache.set(newkey, data, 86400, () => {
                    console.log(`v: ${data}`)
                })
            }
            
        })

    // async function get() {
    //     const d = await cache.get(data[2].key)
    //     console.log('GET', d ? d : 'not found')
    // }
    // get()

    // async function has() {
    //     const d = await cache.has(data[2].key)
    //     console.log('HAS', d ? 'found' : 'not found')
    // }
    // has()

    // async function keys() {
    //     const d = await cache.keys()
    //     console.log('KEYS', d)
    // }
    // keys()
    
    // async function delete2() {
    //     const d = await cache.delete(data[2].key)
    //     console.log('DEL', d ? `failed to delete: ${d}` : 'deleted')
    // }
    // delete2()
    
    // async function has2() {
    //     const d = await cache.has(data[2].key)
    //     console.log('HAS', d ? 'found' : 'not found')
    // }
    // has2()
}
else {
    cache.set(data[2].key, data[2].value, data[2].ttl, after.set)
    cache.get(data[2].key, after.get)
    //cache.keys('foo', after.keys)
    

        // .then(after.set())
        // .then(cache.get(data[2].key).then(after.get()))
        // .then(cache.has(data[2].key).then(after.has()))
        // .then(
        //     cache.keys().then(after.keys())
        //         .then(cache.delete(data[2].key).then(after.delete()))
        //         .then(cache.has(data[2].key).then(after.has()))
        // )
}


curl -G -v 'http://127.0.0.1:3010/v3/treatments' \
--data-urlencode 'location=within({"r":50,"units":"kilometers","lat":-41,"lng":0})' | jq '.'