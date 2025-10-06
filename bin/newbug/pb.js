function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    
    //The maximum is exclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min) + min);
}

// Returns a Promise that resolves after "ms" Milliseconds
const timer = ms => new Promise(res => setTimeout(res, ms))

function formatMs(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    
    let str = `${seconds}.${milliseconds}s`;
    if (minutes) str = `${minutes}m ${str}`;
    if (hours) str = `${hours} ${str}`;
    return str;
}

async function proc(totalFiles) {
    
    // Calcuate the size of the bactch based on totalFiles
    let batch = 7500;
    if (totalFiles < batch) batch = totalFiles;
    
    // Print a dot every 1/10 of the batch
    const dot = Math.round(batch / 10);
    
    let filesProcessed = 1;
    let elapsedTime = 0;
    const colSepWidth = 2;
    
    const tableHeaders = [
        { text: `progress (each "." is ${dot} files)`, width: 9 },
        { text: 'total files processed', width: 10 },
        { text: 'time taken per batch', width: 6 },
        { text: 'ms / file', width: 4 },
        { text: 'files / sec', width: 7 },
        { text: 'rows inserted', width: 10 },
        { text: 'rows / sec', width: 6 },
        { text: 'elapsed time', width: 15 }
    ];
    
    console.log(headers(tableHeaders, colSepWidth));
    
    let t0 = new Date();
    let t1;
    let timeTaken;
    let isNine = 1;
    
    for (; filesProcessed <= totalFiles; filesProcessed++) {
        await timer(1);
        
        if (!(filesProcessed % batch)) {
            t1 = new Date();
            timeTaken = t1 - t0;
            elapsedTime += timeTaken;
            const s = formatPbNumbers(batch, tableHeaders, filesProcessed, timeTaken, elapsedTime, isNine);
            console.log(s);
            t0 = new Date();
            isNine = 1;
        }
        else if (!(filesProcessed % dot)) {
            process.stdout.write('.');
            isNine++;
        }
        
    }
    
    t1 = new Date();
    timeTaken = t1 - t0;
    elapsedTime += timeTaken;
    const s = formatPbNumbers(batch, tableHeaders, filesProcessed - 1, timeTaken, elapsedTime, isNine);
    console.log(s);
}

function formatPbNumbers(batch, tableHeaders, filesProcessed, timeTaken, elapsedTime, isNine) {
    const msPerFile = (isNine * (batch / 10)) / timeTaken;
    const filesPerSec = msPerFile * 1000;
    const rowsInserted = getRandomInt(25000, 50000);
    const rowsPerSec = rowsInserted * 1000 / timeTaken;
    const space = isNine < 9 ? ' '.repeat(9 - isNine + 1) : '';
    const columns = [
        filesProcessed,
        timeTaken,
        msPerFile,
        filesPerSec,
        rowsInserted,
        rowsPerSec,
        formatMs(elapsedTime)
    ];
    const widths = tableHeaders.map(th => th.width);
    const str = columns.map((col, idx) => {
        idx += 1;
        let s;
        
        if (typeof(col) === 'number') {
            s = String(col.toFixed(0)).padStart(widths[idx]);
        }
        else {
            s = String(col).padStart(widths[idx]);
        }
        
        return s;
    }).join('  ');
    
    return `${space}  ${str}`
}

function headers(tableHeaders, colSepWidth) {
    const colsep = ' '.repeat(colSepWidth);
    const topLineChar = '━';
    const btmLineChar = '─';
    const thText = tableHeaders.map(th => th.text);
    const widths = tableHeaders.map(th => th.width);
    
    // Helper function: word-wrap text to a given width
    function wrapText(text, width) {
        const words = text.split(/\s+/);
        const lines = [];
        let line = '';
    
        for (const word of words) {
            if ((line + (line ? ' ' : '') + word).length <= width) {
                line += (line ? ' ' : '') + word;
            } 
            else {
                if (line) lines.push(line);
                line = word;
            }
        }
        
        if (line) lines.push(line);
        return lines;
    }

    // Step 1: wrap each sentence according to its column width
    const wrapped = thText.map((th, i) => wrapText(th, widths[i]));
    
    // Step 2: find the maximum number of lines across all columns
    const maxLines = Math.max(...wrapped.map(lines => lines.length));
    
    // Step 3: pad columns so they all have the same number of lines
    wrapped.forEach((lines, i) => {
        while (lines.length < maxLines) lines.push('');
    });

    // Step 4: collect the header lines
    const headers = [widths.map(w => topLineChar.repeat(w)).join(colsep)];
    
    // Step 5: print each row of wrapped text
    for (let i = 0; i < maxLines; i++) {
        const row = wrapped.map((col, j) => col[i].padEnd(widths[j], ' '))
            .join(colsep);
        headers.push(row);
    }
    
    // Step 6: print the bottom separator line
    headers.push(widths.map(w => btmLineChar.repeat(w)).join(colsep));
    return headers.join('\n');
}

const totalFiles = 9201;
proc(totalFiles)