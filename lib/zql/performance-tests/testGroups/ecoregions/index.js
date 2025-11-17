const geoSchema = 'geo';
export const sampleQueries = [

    {
        desc: `count`,
        input: {
            resource: 'ecoregions',
            searchparams: 'cols='
        },
        output: {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM ${geoSchema}.ecoregions`,

                "full": null
            },
            "runparams": {},
            "num_of_records": 758087
        }
    },

    {
        desc: `all ecoregions`,
        input: {
            resource: 'ecoregions',
            searchparams: ''
        },
        output: {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM ecoregions WHERE ecoregions."eco_name" LIKE @eco_name`,

                "full": `SELECT ecoregions."id", ecoregions."eco_name", ecoregions."biome_name" FROM ecoregions WHERE ecoregions."eco_name" LIKE @eco_name GROUP BY images."id" ORDER BY +ecoregions."id" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {
                "eco_name": "admiralty%"
            },
            "num_of_records": 1955
        }
    },

    //0: 
    {
        desc: `eco_name starting with`,
        input: {
            resource: 'ecoregions',
            searchparams: 'eco_name=Admiralty'
        },
        output: {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM ecoregions WHERE ecoregions."eco_name" LIKE @eco_name`,

                "full": `SELECT ecoregions."id", ecoregions."eco_name", ecoregions."biome_name" FROM ecoregions WHERE ecoregions."eco_name" LIKE @eco_name GROUP BY images."id" ORDER BY +ecoregions."id" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {
                "eco_name": "admiralty%"
            },
            "num_of_records": 1955
        }
    },

    {
        desc: `all biomes`,
        input: {
            resource: 'biomes',
            searchparams: ''
        },
        output: {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM ${geoSchema}.biomes`,

                "full": `SELECT ${geoSchema}.biomes."id", ${geoSchema}.biomes."biome_name", biome_synonyms.biome_synonym FROM ${geoSchema}.biomes ORDER BY +${geoSchema}.biomes."id" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {},
            "num_of_records": 1955
        }
    }
]