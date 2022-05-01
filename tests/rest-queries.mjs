'use strict';

// const fetch = require('node-fetch');
// const queries = require('./queries.json');
import { queries } from './queries.mjs';
import got from 'got';

// const query = async (queries) => {
//     let t = process.hrtime();

//     for (let i = 0, j = queries.length; i < j; i++) {
//         let t = process.hrtime();
//         const q = `http://localhost:3010/v3/${queries[i]}&refreshCache=true`;
//         const response = await fetch(q);
//         const result = await response.json();
//         t = process.hrtime(t);
        
//         const ms = Math.round((t[0] * 1000) + (t[1] / 1000000));
//         if (ms > 500) {
//             console.log('s', ms, q);
//         }
//     }

//     t = process.hrtime(t);
//     const ms = Math.round((t[0] * 1000) + (t[1] / 1000000));
//     console.log(`serial took ${ms}`);
// }

const query2 = async (queries) => {
    let t = process.hrtime();

    const bad = [];
    const slow = [];

    const r = await Promise.all(queries.map(async (q) => {
        process.stdout.write('.');

        let t = process.hrtime();
        const url = `http://localhost:3010/v3/${q}`;
        // const response = await fetch(url);

        // // if HTTP-status is 200-299
        // if (response.ok) { 

        //     // get the response body (the method explained below)
        //     const result = await response.json();
        //     t = process.hrtime(t);
        //     const ms = Math.round((t[0] * 1000) + (t[1] / 1000000));

        //     if (ms > 500) {
        //         //console.log('p', ms, q);
        //         slow.push(q);
        //     }
        // } 
        // else {
        //     //alert("HTTP-Error: " + response.status);
        //     bad.push(q);
        // }

        try {
            const { body } = await got(url);
            t = process.hrtime(t);
            const ms = Math.round((t[0] * 1000) + (t[1] / 1000000));

            if (ms > 500) {
                slow.push(q);
            }
        } 
        catch (error) {
            //console.error(error);
            bad.push(q);
        }

        return true;
    }));

    t = process.hrtime(t);
    const ms = Math.round((t[0] * 1000) + (t[1] / 1000000));
    console.log(`\nparallel took ${ms}`);

    console.log(bad);
    console.log(JSON.stringify(slow, null, 2));
}

const notImages = (q) => q.substring(0, 7) !== 'images?';
const qrs = queries.filter(notImages);
//console.log(qrs)


// query(qrs);
query2(qrs);
