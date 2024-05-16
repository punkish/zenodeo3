import { progressBar } from "./utils.js";

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function wait(delay) {
    const end = Date.now() + delay;
    while (Date.now() < end) continue;
};

function insertInDb() {
    const delay = getRandomInt(800, 2000);
    wait(delay);
}

function processFile() {
    const delay = getRandomInt(5, 10);
    wait(delay);
}

const startETL = process.hrtime.bigint();
const totalFiles = getRandomInt(20000, 60000);
const defaultBatch = 7500;
const batch = totalFiles < defaultBatch 
    ? Math.floor(totalFiles / 10) 
    : defaultBatch;
const dot = batch / 10;

const pbOpts = { 
    totalFiles,
    fileNum: null,
    startBatch: null,
    endBatch: null,
    batch,
    startETL,
    rowsIns: null
};

const str = progressBar(pbOpts);

console.log(str);

for (let fileNum = 0; fileNum < totalFiles; fileNum++) {
    pbOpts.startBatch = process.hrtime.bigint();
    processFile();

    // first file
    if (fileNum === 0) {
        pbOpts.fileNum = fileNum;
        pbOpts.endBatch = process.hrtime.bigint();
        pbOpts.rowsInserted = batch * getRandomInt(1, 5);

        const str = progressBar(pbOpts);

        // print the headers
        console.log(str);
    }
    else if (fileNum % batch === 0) {
        
        // insert in db
        insertInDb();

        pbOpts.fileNum = fileNum;
        pbOpts.endBatch = process.hrtime.bigint();
        pbOpts.rowsInserted = batch * getRandomInt(1, 5);
        
        // print the progress bar at the end of every batch
        const str = progressBar(pbOpts);

        console.log(`. ${str}`);
    }
    else if (fileNum % dot === 0) {
        
        // print a dot every 1/10th of the batch, usually 750 files
        process.stdout.write('.');
    }

    // last file
    else if (fileNum === (totalFiles - 1)) {
        
        // insert in db
        console.log(' done!')
    }
}