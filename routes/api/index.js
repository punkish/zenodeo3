import { routeFactory } from '../../lib/routeUtils.js';
import { resources } from '../../data-dictionary/resources/index.js';
import zlib from 'zlib';

/**
 * create the root route
 * @param {string} resource - name of the resource.
 */
const rootRoute = async function (fastify, opts) {
    const options = {
        method: 'GET',
        url: '/',
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://example.com/root.schema.json",
            title: "API root",
            summary: "This is where it starts",
            description: "This is the root of the Zenodeo API",
            response: {},
            querystring: {},
            tags: [ 'zenodeo' ]
        },
        handler: async (request, reply) => {
            return Object.values(Object.fromEntries(fastify.routes))
                .flat(1)
                .filter(a => a.schema.tags)
                .map(a => {
                    return {
                        title: a.schema.title,
                        summary: a.schema.summary,
                        description: a.schema.description,

                        // usually no url fragments in config have either 
                        // leading or trailing slashes EXCEPT those
                        // returned by `fastify.routes`. That is why there 
                        // is no slash in the setting below because 
                        // `a.url` already contains a leading slash
                        //
                        url: `${fastify.zconfig.url.zenodeo}${a.url}`
                    }
                });
        }
    };

    fastify.route(options);
};

// Router to return a single XML of the treatment
const xmlRoute = async function (fastify, opts) {
    const options = {
        method: 'GET',
        url: '/treatments-archive/',
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://example.com/root.schema.json",
            title: 'xml',
            summary: 'treatment xml',
            description: 'treatment xml',
            response: {},
            querystring: {},
            tags: [ 'zenodeo' ]
        },
        handler: async (request, reply) => {
            return request.pathname
        }
    };

    fastify.route(options);
};

function getTileFromCache(fastify, layer, z, x, y) {
    let sql;

    if (layer === 'countries-coastline-1m') {
        sql = `
            SELECT tile 
            FROM geodeo_countries."${layer}" 
            WHERE z = $z AND x = $x AND y = $y
        `;
    }
    else {

        if (layer === 'nev') {
            sql = `
                SELECT tile_data AS tile 
                FROM geodeo_nev.tiles 
                WHERE zoom_level = $z AND tile_column = $x AND tile_row = $y
            `;
        }
        else if (layer === 'nev_raster') {
            if (z < 7) {
                sql = `
                    SELECT tile_data AS tile 
                    FROM geodeo_nev7.tiles 
                    WHERE zoom_level = $z AND tile_column = $x AND tile_row = $y
                `;
            }
            else {
                sql = `
                    SELECT tile_data AS tile 
                    FROM geodeo_nev7plus.tiles 
                    WHERE zoom_level = $z AND tile_column = $x AND tile_row = $y
                `;
            }
        }
        else {
            //dbfile = `50m_cultural/mbtiles/${layer}.mbtiles`;
        }
    }

    const res = fastify.zqlite.prepare(sql).get({ z, x, y });
    
    if (res) {

        if (layer === 'nev') {
            const data = Buffer.from(res.tile);

            // => Uint8Array
            return zlib.gunzipSync(data);
        }
        else {
            return res.tile;
        }
        
    }
    else {
        
    }
}


const geoRoute = function(fastify, opts) {
    
    const options = {
        method: 'GET',
        url: '/geo/:layer/:z/:x/:y',
        schema: {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://example.com/root.schema.json",
            title: 'geo',
            summary: 'geo layers',
            description: 'various geo layers',
            response: {},
            querystring: {},
            tags: [ 'zenodeo' ]
        },
        handler: (request, reply) => {
            const { layer, z, x, y } = request.params;

            if (layer && z && x && y) {
                const tile = getTileFromCache(fastify, layer, z, x, y);
                return new Response(
                    tile, 
                    {
                        headers: {
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Methods": "GET"
                        }
                    }
                );
            }
            
        }
    }

    fastify.route(options);
};

// Start with an array of all the routes
const routes = resources
    .map(resource => routeFactory(resource.name));

// Add the xmlRoute to the end of the array
routes.push(xmlRoute);
routes.push(geoRoute);

// Add the root route to the beginning of the array
routes.unshift(rootRoute);

export { routes }