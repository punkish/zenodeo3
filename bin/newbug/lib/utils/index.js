import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';

function pathToXml(xml) {
    const one = xml.substr(0, 1);
    const two = xml.substr(0, 2);
    const thr = xml.substr(0, 3);
    return `${one}/${two}/${thr}`
}
    
function getWeek(d = new Date()) {
    const first_of_month = new Date(d.getFullYear(), d.getMonth(), 1);
    const ms = d - first_of_month;
    const days = Math.ceil(ms / 1000 / 60 / 60 / 24);
    let week = days <= 7 ? 1 : Math.floor(days / 7);
    week += days % 7 ? 1 : 0;
    
    return String(week).padStart(2, '0');
}

function getMonth(mm) {
    const months = [
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
    ];
    return months[mm].substring(0, 3).toLowerCase();
}

function deconstructDate(d) {
    return {
        ms: d.getTime(),
        yyyy: String(d.getFullYear()),
        mm: String(d.getMonth() + 1).padStart(2, 0),
        ww: getWeek(d),
        dd: String(d.getDate()).padStart(2, 0)
    }
}

// given a typeOfArchive, return an archive name
function getArchiveNameAndTimestamp(typeOfArchive, d = new Date()) {
    
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

    return { 
        typeOfArchive: archive_name, 
        timeOfArchive: archive_updated 
    };
}

// given an archive name, return the correct typeOfArchive
function getTypeOfArchive(archive_name) {
    return archive_name
        .split('.')
        .slice(2, 3)[0];
}
    
function getLastUpdate(typeOfArchive) {
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

function getWeekOfYear(date = new Date()) {
    const first_of_year = new Date(
        date.getUTCFullYear(),  // yyyy
        0,                      // m
        1                       // d
    );

    const ms_till_date = date - first_of_year;
    const days_till_date = Math.ceil(ms_till_date / 1000 / 60 / 60 / 24);

    let w = Math.floor(days_till_date / 7);
    if (days_till_date % 7) w += 1;
    
    return w;
}

function getPeriodOfArchive(typeOfArchive, date) {
    
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

function pruneTypesOfArchives(last, typesOfArchives) {        
    const lastTypeOfArchive = last.typeOfArchive;
    const lastTimeOfArchive = last.timeOfArchive;
    const yearOfArchive = last.timeOfArchive.split('-')[0];
    const yearOfToday = (new Date()).getFullYear();

    // find out the timePeriod of the typeOfArchive if it were to be 
    // processed "today". For example, if the archive is 'yearly', get 
    // current year. For the 'monthly' archive, get current month, 
    // and so on
    const periodOfArchiveToday = this.getPeriodOfArchive(
        lastTypeOfArchive, new Date()
    );

    // similar to above, get the period of the last processed archive
    const periodOfLastArchive = this.getPeriodOfArchive(
        lastTypeOfArchive, new Date(lastTimeOfArchive)
    );

    if (yearOfArchive == yearOfToday) {

        if (periodOfLastArchive >= periodOfArchiveToday) {

            // we don't process this archive
            const i = typesOfArchives.findIndex(a => a === lastTypeOfArchive);
            const typeOfArchive = typesOfArchives[i];
            this.log.info(`we don't process "${typeOfArchive}" archive`);

            // remove index i from typesOfArchives
            typesOfArchives.splice(i, 1);
        }
        
    }
    
}

function snipDir(dir, prefix) {
    return dir.replace(prefix, '.')
}

function checkDir ({ dir, removeFiles=false }) {
    this.logger.info(`checking if "${snipDir(dir, '/Users/punkish/Projects/zenodeo3')}" exists… `);
    const exists = fs.existsSync(dir);

    if (exists) {
        this.logger.info('    ✅ yes, it does');

        if (removeFiles) {
            this.logger.info(`removing all files from ${dir} directory`);

            if (this.mode !== 'dryRun') {
                fs.readdirSync(dir)
                    .forEach(f => fs.rmSync(`${dir}/${f}`));
            }

        }
    }
    else {
        this.logger.info("    ❌ it doesn't exist, so making it");
        
        if (this.mode !== 'dryRun') {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

}

function cleanText(str) {
    str = str.replace(/\s+/g, ' ');
    str = str.replace(/\s+,/g, ',');
    str = str.replace(/\s+:/g, ':');
    str = str.replace(/\s+\./g, '.');
    str = str.replace(/\(\s+/g, '(');
    str = str.replace(/\s+\)/g, ')');
    str = str.trim();
    return str;
}

async function determineArchiveType(source) {
    
    if (source === 'tb') {
        this.stats.archive.typeOfArchive = 'tb';
    }
    else if (source === 'synthetic') {
        this.stats.archive.typeOfArchive = 'synthetic';
    }
    else {

        // check if the source exists as a file or dir
        try {
            const stat = fs.statSync(source);
            const d = stat.birthtime;
            const [dateOfArchive, timeOfArchive] = d.toISOString().split('T');
            
            if (stat.isDirectory()) {
                const { dirSize, files } = await getDirSize(source);

                // Update typeOfArchive only if it doesn't already exist
                // as it might have been set earlier as 'tb'
                if (this.stats.archive.typeOfArchive == 'tb') {

                    // Given the source as follows, we want only the maked part
                    // '/Users/punkish/Projects/zenodeo3/data/treatments-dumps/monthly.2025-11-02'
                    //                                                         ^^^^^^^
                    const nameOfArchive = source.split('/').pop().split('.')[0];
                    this.stats.archive.nameOfArchive = nameOfArchive;
                }
                else {
                    this.stats.archive.typeOfArchive = 'dir';
                    this.stats.archive.nameOfArchive = source;
                }
                
                this.stats.archive.dateOfArchive = dateOfArchive;
                this.stats.archive.sizeOfArchive = Number(dirSize);
                this.stats.archive.numOfFiles = files.length;
                this.stats.archive.files = files;
            }
            else if (stat.isFile()) {
                this.stats.archive.typeOfArchive = 'file';
                this.stats.archive.nameOfArchive = source;
                this.stats.archive.dateOfArchive = dateOfArchive;
                this.stats.archive.sizeOfArchive = stat.size;
                this.stats.archive.numOfFiles = 1;
                this.stats.archive.files = [source];
            }
            else {
                this.logger.error(`${source} is neither a file nor a dir`);
                return false;
            }
        }
        catch (error) {
            this.logger.error(error);
        }
    }

    return this.stats.archive.typeOfArchive;
}

// How to get directory size in node.js?
// https://stackoverflow.com/a/69418940/183692
async function getDirSize(dir) {
    const files = await fsPromises.readdir(dir, { withFileTypes: true });
    const filePaths = files.map(async (file) => {
        const filepath = path.join(dir, file.name);

        if (file.isDirectory()) return await dirSize(filepath);

        if (file.isFile()) {
            const { size } = await fsPromises.stat(filepath);
            return size;
        }

        return 0;
    });

    const totalSize = (await Promise.all(filePaths))
        .flat(Infinity)
        .reduce((i, size) => i + size, 0);
    
    return { 
        dirSize: (totalSize / 1024).toFixed(0), 
        files 
    };
}

export {
    pathToXml,
    getWeek,
    getMonth,
    deconstructDate,
    getArchiveNameAndTimestamp,
    getTypeOfArchive,
    getLastUpdate,
    //determinePeriodAndTimestamp,
    getWeekOfYear,
    getPeriodOfArchive,
    pruneTypesOfArchives,
    snipDir,
    checkDir,
    getDirSize,
    cleanText,
    determineArchiveType
}