import { Config } from '@punkish/zconfig';
const config = new Config().settings;
const truebug = config.truebug;
import * as database from './database/index.js';
import Zlogger from '@punkish/zlogger';
const log = new Zlogger();

/**
 * Given an XML, construct a dir path from its basename
 */
function pathToXml(xml) {
    const one = xml.substr(0, 1);
    const two = xml.substr(0, 2);
    const thr = xml.substr(0, 3);
    return `${truebug.dirs.archive}/${one}/${two}/${thr}`
}

/**
 * Keep track of how many times each function is called
 */
function incrementStack(module, fn, stack={}) {
    const incrFn = (fn) => {
        if (fn in stack[module]) {
            stack[module][fn]++;
        }
        else {
            stack[module][fn] = 1;
        }
    }

    if (!(module in stack)) {
        stack[module] = {};
    }
    
    incrFn(fn);
}

const progressBar = ({
    totalFiles,
    fileNum, 
    startBatch,
    endBatch,
    batch,
    startETL,               // time when ETL started
    rowsInserted            // rows inserted in this batch
}) => {

    if (fileNum === null) {
        return `Start of ETL: ${new Date()}\nTotal files: ${totalFiles}; processed: ${batch} at a time`;
    }

// start of ETL: Thu May 16 2024 12:41:31 GMT+0200 (Central European Summer Time)
// Total files: 58283; processed: 7500 at a time
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// progress   files processed time (ms)  ms/file files/sec mem (MB) rows       row/sec elapsed
// ========== =============== ========== ======= ========= ======== ========== ======= =======
// ..........            7500       1471       0      5099        8      15000      10     54s

    const columns = [
        { name: 'progress',        varname: '',               length: 10 },
        { name: 'files processed', varname: 'filesProcessed', length: 15 },
        { name: 'time (ms)',       varname: 'timeInMs',       length: 10 },
        { name: 'ms/file',         varname: 'msPerFile',      length:  7 },
        { name: 'files/sec',       varname: 'filesPerSec',    length:  9 },
        //{ name: 'mem (MB)',        varname: 'memInMb',        length:  8 },
        { name: 'rows inserted',   varname: 'rowsInserted',   length: 13 },
        { name: 'row/sec',         varname: 'rowsPerSec',     length:  7 },
        { name: 'elapsed',         varname: 'elapsed',        length:  7 }
    ];

    if (fileNum === 0) {
        const header = columns.map(col => {
            return col.name.padEnd(col.length, ' ');
        }).join(' ');

        let str = '='.repeat(header.length) + '\n';
        str += header + '\n';
        str += columns.map(col => '-'.repeat(col.length)).join(' ');
        str += '\n';
        return str;
    }

    // time taken for this batch
    const timeInMs = (Number(endBatch - startBatch) / 1e6).toFixed(0);

    const timeUntilNow = Number(endBatch - startETL) / 1e6;

    const cols = {
        filesProcessed: fileNum,
        timeInMs,

        // ms per file in this batch
        msPerFile: (timeInMs / batch).toFixed(0),

        // files processed per sec
        filesPerSec: ((batch / timeInMs) * 1000).toFixed(0),

        // heap memory (in MB) used in this batch
        //memInMb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0),
        rowsInserted,

        // number of inserts/second
        rowsPerSec: ((rowsInserted / timeInMs) * 1000).toFixed(0),

        // time elapsed since ETL started
        elapsed: timeUntilNow > 1000
            ? `${(timeUntilNow / 1000).toFixed(0)}s`
            : `${timeUntilNow.toFixed(0)}ms`
    };
    
    const row = Object.keys(cols).map(col => {
        const len = columns.filter(c => c.varname === col)[0].length;
        return String(cols[col]).padStart(len, ' ');
    });

    return row.join(' ');
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

const getWeekOfYear = (date = new Date()) => {
    const first_of_year = new Date(
        date.getUTCFullYear(), 
        0, 
        1
    );

    const ms_till_date = date - first_of_year;
    const days_till_date = Math.ceil(ms_till_date / 1000 / 60 / 60 / 24);

    let w = Math.floor(days_till_date / 7);
    if (days_till_date % 7) w += 1;
    
    return w;
}

const getPeriodOfArchive = (typeOfArchive, date) => {

    let periodOfArchive;

    if (typeOfArchive === 'yearly') {
        periodOfArchive = date.getUTCFullYear();
    }
    else if (typeOfArchive === 'monthly') {
        periodOfArchive = date.getUTCMonth() + 1;
    }
    else if (typeOfArchive === 'weekly') {
        periodOfArchive = getWeekOfYear(date);
    }

    // https://stackoverflow.com/a/40975730/183692
    else if (typeOfArchive === 'daily') {
        
        const yyyy = date.getUTCFullYear();
        const mm = date.getUTCMonth();
        const dd = date.getUTCDate();
        const end = Date.UTC(yyyy, mm, dd);
        const start = Date.UTC(date.getUTCFullYear(), 0, 0);

        periodOfArchive = (end - start) / 24 / 60 / 60 / 1000;
    }

    return periodOfArchive;
    
}

const pruneTypesOfArchives = (last, typesOfArchives) => {

    const lastTypeOfArchive = last.typeOfArchive;
    const lastTimeOfArchive = last.timeOfArchive;
    const yearOfArchive = last.timeOfArchive.split('-')[0];
    const yearOfToday = (new Date()).getFullYear();

    // find out the timePeriod of the typeOfArchive if it were to be processed
    // "today". For example, if the archive is 'yearly', get current year. For 
    // the 'monthly' archive, get current month, and so on
    const periodOfArchiveToday = getPeriodOfArchive(
        lastTypeOfArchive, new Date()
    );

    // similar to above, get the period of the last processed archive
    const periodOfLastArchive = getPeriodOfArchive(
        lastTypeOfArchive, new Date(lastTimeOfArchive)
    );

    if (yearOfArchive == yearOfToday) {

        if (periodOfLastArchive >= periodOfArchiveToday) {

            // we don't process this archive
            const i = typesOfArchives.findIndex(a => a === lastTypeOfArchive);
            const typeOfArchive = typesOfArchives[i];
            log.info(`we don't process "${typeOfArchive}" archive`);

            // remove index i from typesOfArchives
            typesOfArchives.splice(i, 1);
        }
        
    }
    
}

export { 
    pathToXml, 
    //stack, 
    incrementStack, 
    progressBar, 
    deconstructDate, 
    getArchiveNameAndTimestamp, 
    getTypeOfArchive, 
    getLastUpdate,
    getWeekOfYear,
    getPeriodOfArchive,
    pruneTypesOfArchives
    //determinePeriodAndTimestamp,
}