'use strict';

import * as turf from '@turf/turf'

// geol pattern: operator, radius, units, lat, lng, min_lat, min_lng, max_lat, max_lng

// to make a constraint, we need 
// - left      : col.selname
// - operator  : zql -> sql
// - right.bind: @<col.name>
// - right.vals: val extracted from g
//
const geolocation = (g) => {
    const { radius, units, lat, lng, min_lat, min_lng, max_lat, max_lng } = g;

    const coords = {};

    if (lat && lng) {
        const buffered = turf.buffer(
            turf.point([ Number(lng), Number(lat) ]), 
            Number(radius) || 1, 
            { units: units || 'kilometers'  }
        );
        
        const res = turf.bbox(buffered);
        coords.minX = res[0];
        coords.minY = res[1];
        coords.maxX = res[2];
        coords.maxY = res[3];
    }
    else if (min_lat && min_lng && max_lat && max_lng) {
        coords.minX = min_lng;
        coords.minY = min_lat;
        coords.maxX = max_lng;
        coords.maxY = max_lat;
    }

    const constraint = [];
    let runparams = {};

    for (const [key, val] of Object.entries(coords)) {
        const col = {
            name: key,
            where: `materialCitationsRtree.${key}`
        };

        const operator = key.indexOf('max') > -1
            ? '>='
            : '<=';

        const res = geoloc({ col, val, operator });
        constraint.push(res.constraint);
        runparams = { ...runparams, ...res.runparams };
    }

    return { constraint, runparams };
}

const geoloc = ({ col, val, operator }) => {
    const runparams = {};
    runparams[col.name] = val;
    
    return { 
        constraint: `${col.where} ${operator} @${col.name}`, 
        runparams 
    }
}

export { geolocation, geoloc }