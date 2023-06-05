/**
 * This plugin enables the use of cron in a Fastify application.
 * @see https://www.npmjs.com/package/fastify-cron
 */

const cols = 'cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=httpUri&cols=caption';

const queries = {
    images: [
        'cols=',
        'family=Formicidae',
        'class=Actinopterygii',
        'class=Arachnida',
        'class=Malacostraca',
        'captionText=phylogeny',
        'q=phylogeny',
        'q=phylogeny AND plantae',
        'journalTitle=eq(European Journal of Taxonomy)',
        'articleDOI=10.11646/zootaxa.5284.3.7',
        'articleTitle=starts_with(Morphology and taxonomic assessment)',
        `geolocation=within(radius:10, units:'kilometers', lat:40.21, lng:-120.33)`,
        'class=Actinopterygii&publicationDate=since(2021-12-21)',
        'checkinTime=since(yesterday)',
        'tyrannosaurus&authorityName=Osborn',
        'family=Agamidae',
        'q=moloch OR horridus',
        'decapoda&journalTitle=not_like(zootaxa)'
    ],
    treatments: [
        'cols='
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

            console.log(qs)
            return {

                // starting at midnight, every two mins
                cronTime: `${i * 2} 0 * * *`,
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