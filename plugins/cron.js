/**
 * This plugin enables the use of cron in a Fastify application.
 * @see https://www.npmjs.com/package/fastify-cron
 */

const cols = 'page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption';

const queries = {
    images: [
        `cols=`,
        `family=Formicidae`,
        `class=Actinopterygii`,
        `class=Arachnida`,
        `class=Malacostraca`,
        `captionText=phylogeny`,
        `q=phylogeny`,
        `q=phylogeny AND plantae`,
        `journalTitle=eq(European Journal of Taxonomy)`,
        `articleDOI=10.11646/zootaxa.5284.3.7`,
        `articleTitle=starts_with(Morphology and taxonomic assessment)`,
        `geolocation=within(radius:10, units:'kilometers', lat:40.21, lng:-120.33)`,
        `class=Actinopterygii&publicationDate=since(2021-12-21)`,
        `checkinTime=since(yesterday)`,
        `q=tyrannosaurus&authorityName=Osborn`,
        `family=Agamidae`,
        `q=moloch OR horridus`,
        `q=decapoda&journalTitle=not_like(zootaxa)`,
        `biome=savanna`,
        `biome=veld`,
        `biome=pampas`,
        `biome=Tundra`,
        `biome=Tropical and Subtropical Moist Broadleaf Forests`,
        `biome=Mediterranean Forests, Woodlands and Scrub`,
        `biome=Deserts and Xeric Shrublands`,
        `biome=Temperate Grasslands, Savannas and Shrublands`,
        `biome=Boreal Forests/Taiga`,
        `biome=Temperate Conifer Forests`,
        `biome=Temperate Broadleaf and Mixed Forests`,
        `biome=Montane Grasslands and Shrublands`,
        `biome=Mangroves`,
        `biome=Flooded Grasslands and Savannas`,
        `biome=Tropical and Subtropical Grasslands, Savannas and Shrublands`,
        `biome=Tropical and Subtropical Dry Broadleaf Forests`,
        `biome=Tropical and Subtropical Coniferous Forests`
    ],
    treatments: [
        `cols=`
    ]
};

const jobs = [];
let i = -1;

Object.keys(queries)
    .forEach((resource) => {
        const queryStrings = queries[resource];
        const qry = queryStrings.map((qry, idx) => {
            i++;

            const qs = idx
                ? `/v3/${resource}?${qry}&${cols}&refreshCache=true`
                : `/v3/${resource}?cols=&refreshCache=true`;

            return {

                // starting at midnight, every min
                cronTime: `${(i * 1)} 0 * * *`,
                onTick: async server => {
                    try {
                        await server.inject(qs);
                    } 
                    catch (err) { 
                        console.error(err);
                    }
                },
                start: true
            }
        });

        jobs.push(...qry);
    })

export const cronOpts = { jobs }