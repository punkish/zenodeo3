import { Zts } from '../../../zts/src/index.js';
import Database from "better-sqlite3";
const dir = './data/db';
const db = new Database(`${dir}/zenodeo.sqlite`);

function printResults({ term, listOfPositions, snippets, indexSize }) {
    //let str  = `The search index size: ${indexSize} words\n`;
    let str = `The term "${term}" is in:\n`;

    if (snippets) {
        str += 'doc snippets\n';
    }
    else if (listOfPositions) {
        str += 'doc positions\n';
    }

    str += '--- ---------';
    console.log(str);

    if (snippets) {
        const col1width = 3;
                        
        for (const snippet of snippets) {
            const [ docId, snips ] = snippet;
            const str = [  ];
            
            snips.forEach((snip, index) => {
                let padLength = snip.length;

                if (index) {
                    padLength += col1width;
                    str.push(snip.padStart(padLength + 1));
                }
                else {
                    str.push(`${String(docId).padStart(col1width)} ${snip.padStart(padLength)}`);
                }

            });

            console.log(str.join('\n'));
        }
    }
    else if (listOfPositions) {
        for (const listOfPositionsInDoc of listOfPositions) {
            const [ docId, positions ] = listOfPositionsInDoc;
            console.log(`${String(docId).padStart(3)} ${positions}`);
        }
    }
}



async function addToIndex(db) {
    const stmt = db.prepare(
        'SELECT id, fulltext AS text FROM treatments'
    );
    
    const docs = [];
    
    for (const row of stmt.iterate()) {
        docs.push(row);
    
        if (!(row.id % 50000)) {
            const zts = new Zts();
            await zts.addToIndex(docs);
            docs.length = 0;
        }
    
    }
    
    const zts = new Zts();
    await zts.addToIndex(docs);
}

console.time('addToIndex');
//const zts = new Zts();
await addToIndex(db);
console.timeEnd('addToIndex');

async function search(term, db, zts) {
    const stmt = db.prepare(
        'SELECT id, fulltext AS text FROM treatments WHERE id = ?'
    );

    const { lops, getSnippet } = await zts.search(term);

    const snippets = [];
    const options = {
        bookends: 20,
        wrap: {
            open: '<span class="zts">',
            close: '</span>'
        },
        ext: '…'
    }
    
    for (const listOfPositionsInDoc of lops) {
        const [ docId, positions ] = listOfPositionsInDoc;
        const doc = stmt.get(docId);
    
        // Each snip is a string
        // A collection of snips in a doc is an array of docId and snips
        // Array snips [
        //      Number docId,
        //      Array snips [
        //          String snip
        //          String snip
        //      ]
        // ]
        const snips = [];
    
        for (const position of positions) {
            const start = position - options.bookends;
            const length = position + term.length + options.bookends;
            let snip = doc.text.substring(start, length);
            
            // Let's find the term in the snip. The term may be in different
            // case from the term
            const termLen = term.length;
            const origTerm = doc.text.substring(position, position + termLen);
    
            let replacement  = options.wrap.open;
                replacement += origTerm;
                replacement += options.wrap.close;
    
            snip =  options.ext + 
                    snip.replace(origTerm, replacement) + 
                    options.ext;
            
            snips.push(snip);
        }
    
        snippets.push([ docId, snips ])
    }
    
    printResults({ 
        term, 
        listOfPositions: false, 
        snippets,
        //indexSize: Object.keys(index).length
    });
}
// 
//const docs = stmt.all();
const term = 'segment';
//search(term, db, zts);
// const tf = await zts.getTokenFrequency(term);
// console.log(tf);
