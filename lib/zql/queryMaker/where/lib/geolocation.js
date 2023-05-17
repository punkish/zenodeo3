'use strict';

import * as utils from '../../../utils.js';
import * as turf from '@turf/turf'

const pattern = utils.getPattern('geolocation2');

const geolocation = ({ key, val }) => {
    let constraint;
    let debug;
    let coords;
    const runparams = {};
    const m = val.match(pattern);
    
    if (m) {
        const { operator, radius, units, lat, lng, min_lat, min_lng, max_lat, max_lng } = m.groups;

        if (operator === 'within') {
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
        }
    }

    constraint = `materialCitationsRtree.minX BETWEEN @min_lng AND @max_lng AND materialCitationsRtree.minY BETWEEN @min_lat AND @max_lat`;

    debug = `materialCitationsRtree.minX BETWEEN ${coords[0]} AND ${coords[2]} AND materialCitationsRtree.minY BETWEEN ${coords[1]} AND ${coords[3]}`;

    runparams.min_lng = Number(coords[0]);
    runparams.min_lat = Number(coords[1]);
    runparams.max_lng = Number(coords[2]);
    runparams.max_lat = Number(coords[3]);

    return { constraint, debug, runparams };
}

export { geolocation }