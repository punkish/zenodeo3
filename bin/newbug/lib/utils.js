import fs from 'fs';

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

// function checkDir ({ dir, removeFiles=false }) {
//     this.logger.info(`checking if "${snipPath(dir, '/Users/punkish/Projects/zenodeo3')}" exists… `);
//     const exists = fs.existsSync(dir);

//     if (exists) {
//         this.logger.info('    ✅ yes, it does');

//         if (removeFiles) {
//             this.logger.info(`removing all files from ${dir} directory`);

//             if (this.mode !== 'dryRun') {
//                 fs.readdirSync(dir)
//                     .forEach(f => fs.rmSync(`${dir}/${f}`));
//             }

//         }
//     }
//     else {
//         this.logger.info("    ❌ it doesn't exist, so making it");
        
//         if (this.mode !== 'dryRun') {
//             fs.mkdirSync(dir, { recursive: true });
//         }
//     }

// }

function snipPath(dir, prefix) {
    return dir.replace(prefix, '.')
}

export {
    determineArchiveType,
    //checkDir,
    snipPath
}
