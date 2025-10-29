import fs from 'fs';
import path from 'path';

async function etl(actions, source) {
    log(`etl():5:start ETL`);
    log(`etl():6:source "${source.type}", actions "${actions.join(',')}"`);

    if (source.type === 'file') {
        if (!isValidFileOrDir(source.value)) {
            throw new Error(`${source.value} is not a valid XML`);
        }
        
        let treatment;

        if (actions.includes('parse')) {
            treatment = parseOne(source.value);
        }

        if (actions.includes('display')) {
            console.log(treatment);
        }

        if (actions.includes('load')) {
            load(treatment);
        }
    }
    else {
        let treatments = [];
        let batch = 16;
        let counter = 0;

        if (source.type === 'dir') {
            if (!isValidFileOrDir(source.value)) {
                throw new Error(`${source.value} is not a valid dir`);
            }

            const files = fs.readdirSync(source.value, { withFileTypes: true });
            const totalCount = files.length;
            if (totalCount <= batch) batch = totalCount;
            log(`etl():40:dir with ${totalCount} elements`);

            for await (const file of files) {
                counter++;

                if (actions.includes('parse')) {
                    const xml = fs.readFileSync(`${dir}/${file.name}`);
                    const treatment = xml2json(xml);
                    treatments.push(treatment);
                }

                if (!(counter % batch)) {
                    process.stdout.write('.');
                    bar(actions, treatments);
                }

            }

            bar(actions, treatments);
        }
        else if (source.type === 'synthetic') {
            const totalCount = source.value;
            log(`etl():62:synthetic data with ${totalCount} elements`);

            if (totalCount <= batch) {
                batch = totalCount;
                const num = source.value;
                treatments.push(...makeTreatments(num));
                foo(actions, treatments);
            }
            else {

                for (let i = 0; i <= source.value; i += batch) {
                    counter++;
                    const remaining = totalCount - (counter * batch);

                    if (remaining > 0) {
                        treatments.push(...makeTreatments(batch));
                    }
                    else {
                        treatments.push(...makeTreatments(batch + remaining));
                    }
                    
                    process.stdout.write('.');
                    foo(actions, treatments);
                }

                //foo(actions, treatments);
            }
        }
    }
    
}

function foo(actions, treatments) {
    if (actions.includes('display')) {
        console.log(treatments);
    }

    if (actions.includes('load')) {
        load(treatments);
    }

    treatments.length = 0;
}

function bar(actions, treatments) {
    
    if (actions.includes('display')) {
        console.log(treatments);
    }

    if (actions.includes('load')) {
        load(treatments);
    }

    treatments.length = 0;
}

function log(msg) {
    const [f, l, s] = msg.split(':');
    console.log(f.padStart(18, ' '), `[${l.padStart(3, ' ')}]`, `- ${s}`);
}

function parse(source, batch) {
    const sourceKind = kindOf(source);
    let treatments;

    if (sourceKind === 'file') {
        log(`source():36:processing file`);
        treatments = [ parseOne(source) ];
    }
    else if (sourceKind === 'dir') {
        log(`source():40:processing dir`);
        treatments = parseMany(source, batch);
    }
    else if (sourceKind === 'json') {
        log(`source():44:processing JSON`);
        
        // nothing to do
        treatments = source;
    }

    return treatments;
}

function load(treatments) {
    const num = treatments.length;
    log(`load():135:loading ${num} treatment${num > 1 ? 's' : ''}`);
}

function parseOne(file) {
    log(`parseOne():49:parsing "${file}"`);
    const xml = fs.readFileSync(file);
    const json = xml2json(xml);
    return json;
}

function xml2json(xml) {
    //log(`xml2json():56:converting xml to json`);
    return {}
}

async function parseMany(dir, batch) {
    log(`parseMany():61:processing "${dir}"`);
    process.stdout.write(' '.repeat(20));
    let count = 0;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const treatments = [];

    for await (const file of files) {
        
        if (count >= batch) {
            count = 0;
            return treatments;
        }
        else {
            count++;

            if (!(count % batch)) {
                process.stdout.write('.');
            }
            
            const xml = fs.readFileSync(`${dir}/${file.name}`);
            //const treatment = xml2json(xml);
            const treatment = {};
            treatments.push(treatment);
        }
        
    }

    return treatments;
}

function isValidFileOrDir(file) {

    // check if it exists as a file
    try {
        const stat = fs.statSync(source.value);

        if (stat.isFile()) {

            // given '/path/to/treatmentId.xml'
            const {
                root, // '/'
                dir,  // '/path/to'
                base, // 'treatmentId.xml'
                ext,  // '.xml'
                name, // 'treatmentId'
            } = path.parse(source.value);

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
    catch {
        // Doesn't exist as a file/directory
    }
}

function makeTreatments(num) {
    log(`makeTreatments():294:make ${num} treatment${num > 1 ? 's' : ''}`);
    return Array.from(Array(num).keys())
}

const actions = ['parse', 'load'];
const dir = 'data/treatments-dumps/xmls';
const source = {
    type: 'file',
    value: `${dir}/00078788D744DE18E88B8B8BFE7FDBF9.xml`
}
// source.type = 'dir',
// source.value = dir;
// source.type = 'synthetic',
// source.value = 33;

etl(actions, source);