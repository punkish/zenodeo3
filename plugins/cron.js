// 
// This plugin enables the use of cron in a Fastify application.
// @see https://www.npmjs.com/package/fastify-cron
// 

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const cronQueries = config.cronQueries;
const queryParams = cronQueries.queryParams;
const queries = cronQueries.queries;

const jobs = [];
let i = 0;

Object.keys(queries)
    .forEach((resource) => {
        const queryStrings = queries[resource];
        const qry = queryStrings.map((qry, idx) => {
            const qs = idx
                ? `/v3/${resource}?${qry}&${queryParams}`
                : `/v3/${resource}?cols=&cacheDuration=1`;

            const job = {

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

            i++;
            return job;

        });

        jobs.push(...qry);
    })

export const cronOpts = { jobs }