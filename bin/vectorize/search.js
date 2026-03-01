import { Searcher } from './lib/searcher.js';

async function search() {
    

    const args = process.argv.slice(2);
    let q = '';

    if (args.includes('--q')) {
        q = args[1];
    }
    else {
        console.log('Please enter a question');
        return;
    }

    const s = new Searcher();
    await s.init();

    
    // 'What does Laephotis botswanae eat?';
    // 'Which insects come out during the rainy season in France?'
    // 'Is any species named after Chief Panché Supatá?'

    // Query any single index:
    let results = await s.search(q, {
        index: 'usearch',   // 'sqliteVec' | 'sqliteVector' | 'usearch' | 'zvec'
        topK:  5,
    });

    console.log(q);
    console.log(results);
    console.log('-'.repeat(50));

    s.close();
}

// Or query all enabled indexes and compare:
//const comparison = await s.searchAll('cockroaches in southern India', { topK: 5 });

//console.log('-'.repeat(50));
//console.log(comparison)
await search();
