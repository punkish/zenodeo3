'use strict';

const fs = require('fs');
const path = require('path');
const Walker = require('walker');
const config = require('config');
const cacheBase = config.get('v3.cache.base');
const cache = `${cacheBase}/cache`;
const zenodeo = config.get('url.zenodeo');
//const JSON5 = require('json5');
const fetch = require('node-fetch');
let countTotal = 0;
let countFresh = 0;
const errors = [];
const now = new Date().getTime();
//const queries = {};
const queries = require('../queries.json');

const queryAndCache = (queries) => {
    Object.keys(queries).forEach(q => {
        const intervalID = setTimeout(
            async () => { console.log(q); await fetch(q) }, 
            1000
        );
    })
}

const freshen = async (file) => {
    const text = fs.readFileSync(file, 'utf8');
    try {
        const data = JSON.parse(text);

        const life = data.stored + data.ttl;
        if (life < now) {
            const parts = file.split('/');
            const ri = parts.indexOf('cache') + 1;
            const resource = parts[ri].toLowerCase();

            if ('location' in data.item.search) {
                data.item.search.geolocation = data.item.search.location;
                delete data.item.search.location;

                if (data.item.search.geolocation.indexOf('containedIn') > -1) {
                    data.item.search.geolocation = data.item.search.geolocation.replace('containedIn', 'contained_in');
                }

                if (data.item.search.geolocation.indexOf('lowerLeft') > -1) {
                    data.item.search.geolocation = data.item.search.geolocation.replace('lowerLeft', 'lower_left');
                }

                if (data.item.search.geolocation.indexOf('upperRight') > -1) {
                    data.item.search.geolocation = data.item.search.geolocation.replace('upperRight', 'upper_right');
                }
            }

            if ('geolocation' in data.item.search) {
                if (data.item.search.geolocation.indexOf('containedIn') > -1) {
                    data.item.search.geolocation = data.item.search.geolocation.replace('containedIn', 'contained_in');
                }

                if (data.item.search.geolocation.indexOf('lowerLeft') > -1) {
                    data.item.search.geolocation = data.item.search.geolocation.replace('lowerLeft', 'lower_left');
                }

                if (data.item.search.geolocation.indexOf('upperRight') > -1) {
                    data.item.search.geolocation = data.item.search.geolocation.replace('upperRight', 'upper_right');
                }
            }

            if ('$page' in data.item.search) {
                data.item.search.page = data.item.search['$page'];
                delete data.item.search['$page'];
            }

            if ('$size' in data.item.search) {
                data.item.search.size = data.item.search['$size'];
                delete data.item.search['$size'];
            }

            if ('$refreshCache' in data.item.search) {
                data.item.search.refreshCache = data.item.search['$refreshCache'];
                delete data.item.search['$refreshCache'];
            }

            const sp = new URLSearchParams(data.item.search);
            const url = `${zenodeo}/${resource}?${sp.toString()}`;
            await fetch(url);
        }
        else {
            return 1;
        }
    }
    catch(error) {
        errors.push(file);
    }
}

const refreshCache = (cache) => {
    Walker()
    //   .filterDir(function(dir, stat) {
    //     if (dir === '/etc/pam.d') {
    //       console.warn('Skipping /etc/pam.d and children')
    //       return false
    //     }
    //     return true
    //   })
    //   .on('entry', function(entry, stat) {
    //     console.log('Got entry: ' + entry)
    //   })
    //   .on('dir', function(dir, stat) {
    //     console.log('Got directory: ' + dir)
    //   })
        .on('file', function(file, stat) {
            if (path.extname(file) === '.json') {
                countTotal++;
    
                const num = freshen(file);
                if (num === 1) {
                    countFresh++;
                }
            }
        })
        .on('error', function(er, entry, stat) {
            console.log('Got error ' + er + ' on entry ' + entry)
        })
        .on('end', function() {
            console.log(`found ${countTotal} files`);
            console.log(`${countFresh} files are fresh`);
            console.log(`${countTotal - countFresh} files are stale`);
            console.log(`${errors.length} files had errors`);
            console.log(errors);
            //fs.writeFileSync('queries.json', JSON.stringify(queries));
        })
      
}

refreshCache(cache);
//queryAndCache(queries)