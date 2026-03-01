// scripts/benchmark.js
// Runs a set of test queries against all enabled indexes, measures latency
// and prints a comparison table.
//
// Usage:
//   node scripts/benchmark.js
//   node scripts/benchmark.js --queries "What do bats eat?" "cockroaches India"

import Database from 'better-sqlite3';
import { Searcher } from './lib/searcher.js';
import { DB_PATH, INDEXES } from './lib/config.js';

const DEFAULT_QUERIES = [
    'Where does Laephotis botswanae roost?',
    'What kind of cockroaches are found in Southern India?',
    'mycorrhizal fungi plant symbiosis',
    'spider silk tensile strength',
    'deep sea bioluminescent organisms',
];

async function main() {
    const argIdx = process.argv.indexOf('--queries');
    const queries = argIdx !== -1
        ? process.argv.slice(argIdx + 1)
        : DEFAULT_QUERIES;

    const db      = new Database(DB_PATH, { readonly: true });
    const searcher = new Searcher(db).init();

    const enabledIndexes = Object.entries(INDEXES)
        .filter(([, on]) => on)
        .map(([name]) => name);

    log(`Benchmarking indexes: ${enabledIndexes.join(', ')}`);
    log(`Queries: ${queries.length}`);
    console.log('');

    const summary = {};  // { indexName: { totalMs, queriesRun } }

    for (const query of queries) {
        console.log('═'.repeat(72));
        console.log(`Query: "${query}"`);
        console.log('─'.repeat(72));

        const allResults = await searcher.searchAll(query, { topK: 5 });

        for (const [name, results] of Object.entries(allResults)) {
            if (!summary[name]) summary[name] = { totalMs: 0, queriesRun: 0 };

            const t0 = performance.now();
            // (search already ran inside searchAll; re-time for reporting)
            const t1 = performance.now();

            console.log(`\n  [${name}] top ${results.length} results:`);
            for (const r of results) {
                console.log(`    ${r.score.toFixed(4)}  treatmentId=${r.treatmentId}  genus=${r.genus_id}`);
            }
        }
    }

    // Per-index latency is better measured with individual calls:
    console.log('\n' + '═'.repeat(72));
    console.log('LATENCY BENCHMARK (10 repetitions per query per index)');
    console.log('─'.repeat(72));

    for (const name of enabledIndexes) {
        let totalMs = 0;
        for (const query of queries) {
            for (let i = 0; i < 10; i++) {
                const t0 = performance.now();
                await searcher.search(query, { index: name, topK: 5 });
                totalMs += performance.now() - t0;
            }
        }
        const avgMs = (totalMs / (queries.length * 10)).toFixed(2);
        console.log(`  ${name.padEnd(20)} avg: ${avgMs} ms`);
    }

    searcher.close();
    db.close();
}

main().catch(err => { console.error(err); process.exit(1); });
