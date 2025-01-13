// This plugin enables the use of cron in a Fastify application.
// @see https://www.npmjs.com/package/fastify-cron
// 

import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const cronQueries = config.cronQueries;

function getMinsHours(i) {

    // starting at midnight, every min until 59 mins past midnight.
    let m = i;
    let h = 0;

    // Then every minute starting at 1 AM
    if (i > 59) {
        m = i - 60;
        h = 1;
    }

    return { m, h };
}

function initJobs(cronQueries) {
    const queries = cronQueries.queries;
    let i = 0;
    const jobs = [];

    const resources = ['images', 'treatments', 'species'];
    resources.forEach(resource => {
        let qs;

        if (resource === 'species') {
            qs = `/v3/${resource}?cols=`;
            const {m, h} = getMinsHours(i);
            jobs.push({
                cronTime: `${m} ${h} * * *`,
                qs
            });
            i++;
        }
        else {
            const params = cronQueries.params[resource];
            const cols = params.map(param => `cols=${param}`).join('&');
            
            queries.forEach((query, idx) => {
                qs = idx
                    ? `/v3/${resource}?page=1&size=30&${query}&${cols}&yearlyCounts=true`
                    : `/v3/${resource}?cols=&yearlyCounts=true`;

                const {m, h} = getMinsHours(i);
                jobs.push({
                    cronTime: `${m} ${h} * * *`,
                    qs
                });
                i++;
            })
        }
    });

    return jobs;
}

const cronJobs = initJobs(cronQueries);

export { cronJobs }