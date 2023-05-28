'use strict';

import * as turf from '@turf/turf'

// geol pattern: operator, radius, units, lat, lng, min_lat, min_lng, max_lat, max_lng

//
// to make a constraint, we need 
// - left      : col.selname
// - operator  : zql -> sql
// - right.bind: @<col.name>
// - right.vals: val extracted from g
//
const geolocation = (g) => {
    const { radius, units, lat, lng, min_lat, min_lng, max_lat, max_lng } = g;

    let coords;

    if (lat && lng) {
        const buffered = turf.buffer(
            turf.point([ Number(lng), Number(lat) ]), 
            Number(radius) || 1, 
            { units: units || 'kilometers'  }
        );
        
        coords = turf.bbox(buffered);
    }
    else if (min_lat && min_lng && max_lat && max_lng) {
        coords = [ 
            min_lng, 
            min_lat, 
            max_lng, 
            max_lat
        ]
    }

    const constraint = {
        bind: `materialCitationsRtree.minX BETWEEN @min_lng AND @max_lng AND materialCitationsRtree.minY BETWEEN @min_lat AND @max_lat`,

        vals: `materialCitationsRtree.minX BETWEEN ${coords[0]} AND ${coords[2]} AND materialCitationsRtree.minY BETWEEN ${coords[1]} AND ${coords[3]}`
    };

    const runparams = {
        min_lng: Number(coords[0]),
        min_lat: Number(coords[1]),
        max_lng: Number(coords[2]),
        max_lat: Number(coords[3])
    }

    return { constraint, runparams };
}

export { geolocation }