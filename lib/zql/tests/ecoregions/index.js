export const sampleQueries = [

    {
        desc: `count`,
        input: {
            resource: 'ecoregions',
            searchparams: 'cols='
        },
        output: {
            "queries": {
                "count": `SELECT Count(*) AS num_of_records FROM geodata.ecoregions`,

                "full": null
            },
            "runparams": {},
            "num_of_records": 758087
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
        desc: `biome_name starting with`,
        input: {
            resource: 'ecoregions',
            searchparams: 'biome_name=Tropical'
        },
        output: {
            "queries": {
                "count": `SELECT Count(DISTINCT treatments."treatmentId") AS num_of_records FROM treatments JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN materialCitationsRtree ON materialCitations.id = materialCitationsRtree.materialCitations_id WHERE materialCitationsRtree.minX BETWEEN @min_lng AND @max_lng AND materialCitationsRtree.minY BETWEEN @min_lat AND @max_lat`,

                "full": `SELECT treatments."treatmentId", treatments."treatmentTitle", materialCitations."latitude", materialCitations."longitude" FROM treatments JOIN materialCitations ON treatments.id = materialCitations.treatments_id JOIN materialCitationsRtree ON materialCitations.id = materialCitationsRtree.materialCitations_id WHERE materialCitationsRtree.minX BETWEEN @min_lng AND @max_lng AND materialCitationsRtree.minY BETWEEN @min_lat AND @max_lat ORDER BY +treatments."treatmentId" ASC LIMIT 30 OFFSET 0`
            },
            "runparams": {
                "min_lng": 11.601562500000002,
                "min_lat": 40.78885994449482,
                "max_lng": 26.960449218750004,
                "max_lat": 47.931066347509784
            },
            "num_of_records": 1955
        }
    }
]