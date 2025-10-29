import fs from 'fs';
import path from 'path';
function pathToXml(xml) {
    const one = xml.substr(0, 1);
    const two = xml.substr(0, 2);
    const thr = xml.substr(0, 3);
    return `${one}/${two}/${thr}`
}
    
function getWeek(d = new Date()) {
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
    
function determinePeriodAndTimestamp() {
    const last_update = database.getLastUpdate();
    
    // what the archive should be if it were downloaded today
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

function getWeekOfYear(date = new Date()) {
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

function checkDir ({dir, removeFiles = true, logger, mode}) {
    logger.info(`checking if "${snipDir(dir, '/Users/punkish/Projects/zenodeo3')}" exists`);
    const exists = fs.existsSync(dir);

    if (exists) {
        logger.info('✅ yes, it does');

        if (removeFiles) {
            logger.info(`removing all files from ${dir} directory…`);

            if (mode !== 'dryRun') {
                fs.readdirSync(dir)
                    .forEach(f => fs.rmSync(`${dir}/${f}`));
            }

        }
    }
    else {
        logger.info(" ❌ it doesn't exist, so making it");
        
        if (mode !== 'dryRun') {
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


function isValidFileOrDir(file) {
    
    // check if it exists as a file
    try {
        const stat = fs.statSync(file);
        
        if (stat.isFile()) {

            // given '/path/to/treatmentId.xml'
            const {
                root, // '/'
                dir,  // '/path/to'
                base, // 'treatmentId.xml'
                ext,  // '.xml'
                name, // 'treatmentId'
            } = path.parse(file);
            
            // treatmentId regular expression
            const re = /^[a-zA-Z0-9]{32}$/;
            
            if (re.test(name) && ext === '.xml') {
                return true;
            }
        }

        if (stat.isDirectory()) {
            return true;
        }
    } 
    catch (error) {
        throw error;
    }
}

function isValidXML(source) {

    // We have to determine that the source is a valid XML file because 
    // the 'parseOneFile' action works only with files
    if (!source) {

        // Since source was not provided via the CLI, we determine the 
        // value of source based on 'sourceType' and 'sources'
        const sourceType = this.config.sourceType;
        const dir = this.config.dirs.dumps;
        source = `${dir}/xmls/${this.config.sources[sourceType]}.xml`;
    }

    const file = source;
    
    // check if it exists as a file
    try {
        const stat = fs.statSync(file);
        
        if (stat.isFile()) {

            // given '/path/to/treatmentId.xml'
            const {
                root, // '/'
                dir,  // '/path/to'
                base, // 'treatmentId.xml'
                ext,  // '.xml'
                name, // 'treatmentId'
            } = path.parse(file);
            
            // treatmentId regular expression
            const re = /^[a-zA-Z0-9]{32}$/;
            
            if (ext === '.xml') {
                const m = name.match(re);

                if (m.input) {
                    if (this.stats) {
                        this.stats.typeOfArchive = file;
                        this.stats.dateOfArchive = stat.birthtime.toDateString();
                        this.stats.sizeOfArchive = stat.size / 1024;
                        this.stats.numOfFiles = 1;
                    }

                    return m.input;
                }
                else {
                    console.error('file name is not a valid treatmentId');
                }

            }
        }
    } 
    catch (error) {
        throw error;
    }
}

function isDir(file) {
    
    // check if it exists as a file
    try {
        const stat = fs.statSync(file);

        if (stat.isDirectory()) {
            return true;
        }
    } 
    catch (error) {
        throw error;
    }
}

export {
    pathToXml,
    getWeek,
    getMonth,
    deconstructDate,
    getArchiveNameAndTimestamp,
    getTypeOfArchive,
    getLastUpdate,
    determinePeriodAndTimestamp,
    getWeekOfYear,
    getPeriodOfArchive,
    pruneTypesOfArchives,
    snipDir,
    checkDir,
    cleanText,
    isValidFileOrDir,
    isValidXML,
    isDir
}