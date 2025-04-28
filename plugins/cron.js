// This plugin enables the use of cron in a Fastify application.
// @see https://www.npmjs.com/package/node-cron
// 
import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const cronQueries = config.cronQueries;

function getMinsHours(i) {
    return i > 59 

        // starting at midnight, every min until 59 mins past midnight…
        ? { m:i - 60, h:1 } 

        // then every minute starting at 1 AM
        : { m:i, h:0 };
}

function initJobs(cronQueries) {
    let jobs = [];

    if (cronQueries.runCronJobsOnStart || cronQueries.installCronJobs)  {
        let i = 0;
        const resources = ['images', 'treatments', 'species'];
        
        resources.forEach(resource => {
            const queries = resource === 'species' 
                ? cronQueries.queries.slice(0, 1)
                : cronQueries.queries;
            
            queries.forEach((query, idx) => {
                let cols = 'cols=';
                let limits = '';

                if (idx) {
                    cols = cronQueries.params[resource]
                        .map(param => `cols=${param}`).join('&');
                    limits = '&page=1&size=30';
                }

                if (query) query += '&';

                const qs = `/v3/${resource}?${query}${cols}${limits}&yearlyCounts=true`
                const { m, h } = getMinsHours(i);

                //                   ┌──────────────────── second (optional)
                //                   │   ┌──────────────── minute
                //                   │   │    ┌─────────── hour
                //                   │   │    │  ┌──────── day of month
                //                   │   │    │  │ ┌────── month
                //                   │   │    │  │ │ ┌──── day of week
                //                   │   │    │  │ │ │
                //                   │   │    │  │ │ │
                //                   *   *    *  * * *
                jobs.push({ cronTime: `${m} ${h} * * *`, qs });
                i++;

                //console.log(`${i} [${0 + h}:${m}AM]: ${qs.substring(0, 150)}`);
            });
        });
    }

    return { 
        runCronJobsOnStart: cronQueries.runCronJobsOnStart, 
        installCronJobs: cronQueries.installCronJobs, 
        jobs 
    }
}

const cronJobs = initJobs(cronQueries);
export { cronJobs }