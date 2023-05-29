import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;
import * as database from './database/index.js';

const pathToXml = (xml) => {
    const one = xml.substr(0, 1);
    const two = xml.substr(0, 2);
    const thr = xml.substr(0, 3);
    const dir = `${truebug.dirs.archive}/${one}/${two}/${thr}`;

    return dir;
}

const stack = {};

const incrementStack = (mod, fn) => {
    const incrFn = (fn) => {
        if (fn in stack[mod]) {
            stack[mod][fn]++;
        }
        else {
            stack[mod][fn] = 1;
        }
    }

    if (!(mod in stack)) {
        stack[mod] = {};
    }
    
    incrFn(fn);
}

const progressBar = (obj) => {
    const { 
        startETLTime,           // time when ETL started
        startTransactionTime,   // time to process ${batch} files
        startInsertTime,        // time for just db inserts
        i,                      // batch number
        strTotalFilesLen,       // length of the number of files processed
        batch,                  // size of batch
        rowsInserted            // rows inserted in this batch
    } = obj;

    // adjust the number of spaces with which to left pad the 
    // number of files
    const numOfDots = Math.floor((i % batch) / (batch / 10));

    let strLen = strTotalFilesLen;
    if (numOfDots) {
        const remainingDots = 9 - numOfDots;
        strLen += remainingDots;
    }

    const dots = String(i).padStart(strLen + 1, ' ');

    // calculate the num of files in this batch to correctly 
    // figure out ms/file
    const filesTillNow = i % batch || batch;
    
    // calculate various times for the progress bar 
    const end = process.hrtime.bigint();

    // time taken for this transaction
    const transTime = String(
        (Number(end - startTransactionTime) / 1e6).toFixed(0)
    ).padStart(10, ' ');

    // ms per file
    const mspf = String(
        (transTime / batch).toFixed(2)
    ).padStart(8, ' ');

    // files per s
    const fps = String(
        ((batch / transTime) * 1000).toFixed(0)
    ).padStart(5, ' ');

    // time elapsed since ETL started
    const timeUntilNow = Number(end - startETLTime) / 1e6;

    // time to insert rows in db in rows/sec
    const timeToInsert = Number(end - startInsertTime) / 1e9;

    // number of inserts/second
    const ips = String(
        (rowsInserted / timeToInsert).toFixed(0)
    ).padStart(10, ' ');

    let elapsed = timeUntilNow > 1000
        ? `${(timeUntilNow / 1000).toFixed(0)} s`
        : `${timeUntilNow.toFixed(0)} ms`;
    elapsed = elapsed.padStart(5, ' ');

    // calculate the amount of heap memory (in MB) used in this batch
    const mu = process.memoryUsage();
    const mem = (mu.heapUsed / 1024 /1024).toFixed(0);

    let str = ` ${dots}`;
    str += ` [${transTime} ms]`;
    str += ` = (${mspf} ms/file; ${fps} files/s)`;
    str += ` mem: ${mem} MB; `;
    str += ` rows: ${String(rowsInserted).padStart(10, ' ')} (${ips} rows/sec)`;
    str += ` elapsed: ${elapsed}\n`;
    
    return str;
}

const pb = ({ progress, printHeader = false }) => {

    if (printHeader) {
        const header = progress[0];
        let str = Object.keys(header)
            .map(key => {
                const len = header[key].length + 1;
                return key.padStart(len, ' ');
            })
            .join(' ');

        console.log(str);

        str = Object.keys(header)
            .map(key => {
                const len = header[key].length + 1;
                return '-'.repeat(len).padStart(len, ' ');
            })
            .join(' ');

        console.log(str);
    }
    else {
        const header = progress[0];
        const data = progress[1];

        const str = Object.keys(data)
            .map(k => {
                const len = header[k].length + 1;
                return String(data[k]).padStart(len, ' ');
            })
            .join(' ');
        console.log(str);
    }

}

// const progress = [
//     {
//         progress : '.........',
//         files    : '1234567',
//         ms       : '1234567',
//         'ms/file': '123.56',
//         'f/s'    : '123',
//         mem      : '1234',
//         rows     : '12345678',
//         'rows/s' : '12345',
//         elapsed  : '12345678'
//     }
// ];

// progress.push({
//     progress : '.........',
//     files    : '1234567',
//     ms       : '1234567',
//     'ms/file': '123.56',
//     'f/s'    : '123',
//     mem      : '1234',
//     rows     : '12345678',
//     'rows/s' : '12345',
//     elapsed  : '12345678'
// });

// pb({ progress, printHeader: true });
// pb({ progress });

const getWeek = (d = new Date()) => {
    const first_of_month = new Date(
        d.getFullYear(), 
        d.getMonth(), 
        1
    );
    const ms = d - first_of_month;
    const days = Math.ceil(ms / 1000 / 60 / 60 / 24);

    let w = days <= 7 ? 1 : Math.floor(days / 7);
    w += days % 7 ? 1 : 0;
    
    return String(w).padStart(2, '0');
}

const month = (mm) => [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
][mm].substring(0, 3).toLowerCase();

const deconstructDate = (d) => {
    return {
        ms: d.getTime(),
        yyyy: String(d.getFullYear()),
        mm: String(d.getMonth() + 1).padStart(2, 0),
        ww: week(d),
        dd: String(d.getDate()).padStart(2, 0)
    }
}

// given a typeOfArchive, return an archive name
const getArchiveNameAndTimestamp = (typeOfArchive, d = new Date()) => {

    // We first construct the name of the local archive.
    // 'typeOfArchive' is one of 'daily', 'weekly', 'monthly' or 'yearly'.
    // 'timeOfArchive' comes from the last-modified-date of the archive.
    //                                  
    //             timeOfArchive             
    //                  ^            
    //                  |             
    //    typeOfArchive |             
    //        ^         |             
    //        |         | 
    //        |         |       
    //      --+-- ------+--------           
    //      daily.Fri-Mar-31-2023.zip      
    //                                    
    // yearly.Fri-Mar-31-2023.zip
    // monthly.Fri-Mar-31-2023.zip
    // weekly.Fri-Mar-31-2023.zip
    // daily.Fri-Mar-31-2023.zip
    //

    const dtStr = d.toDateString().replace(/ /g, '-');
    const archive_name = `${typeOfArchive}.${dtStr}.zip`;
    let archiveType;

    if (typeOfArchive === 'yearly') {
        archive_updated = yyyy;
    }
    else if (typeOfArchive === 'monthly') {
        archive_updated = mm;
    }
    else if (typeOfArchive === 'weekly') {
        archive_updated = ww;
    }
    else if (typeOfArchive === 'daily') {
        archive_updated = dd;
    }

    return { typeOfArchive: archive_name, timeOfArchive: archive_updated };
}

// given an archive name, return the correct typeOfArchive
const getTypeOfArchive = (archive_name) => archive_name
    .split('.')
    .slice(2, 3)[0];


const getLastUpdate = (typeOfArchive) => {
    const etl_updates = [
        {
            archive: 'yearly',
            last_update: '2022'
        },
        {
            archive: 'monthly',
            last_update: '02'
        },
        {
            archive: 'weekly',
            last_update: '04'
        },
        {
            archive: 'daily',
            last_update: '23'
        }
    ];

    return etl_updates
        .filter(e => e.archive === typeOfArchive)[0]
        .last_update
}

const determinePeriodAndTimestamp = () => {
    const last_update = database.getLastUpdate();
    
    //
    // what the archive should be if it were downloaded today
    //
    const currentTimeOfArchive = new Date().toISOString().split('T')[0];

    const archives = [];

    if (last_update.typeOfArchive === 'yearly') {
        if (last_update.timeOfArchive < currentTimeOfArchive) {
            archives.push('yearly', 'monthly', 'weekly', 'daily');
        }
        else {
            archives.push('monthly', 'weekly', 'daily');
        }
    }
    else if (last_update.typeOfArchive === 'monthly') {
        if (last_update.timeOfArchive < currentTimeOfArchive) {
            archives.push('monthly', 'weekly', 'daily');
        }
        else {
            archives.push('weekly', 'daily');
        }
    }
    else if (last_update.typeOfArchive === 'weekly') {
        if (last_update.timeOfArchive < currentTimeOfArchive) {
            archives.push('weekly', 'daily');
        }
        else {
            archives.push('daily');
        }
    }
    else if (last_update.typeOfArchive === 'daily') {
        if (last_update.timeOfArchive < currentTimeOfArchive) {
            archives.push('daily');
        }
    }

    return archives;
}



export { 
    pathToXml, 
    stack, 
    incrementStack, 
    progressBar, 
    deconstructDate, 
    getArchiveNameAndTimestamp, 
    getTypeOfArchive, 
    getLastUpdate,
    //determinePeriodAndTimestamp,
}