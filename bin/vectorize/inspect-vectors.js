#!/usr/bin/env node
// scripts/inspect-vectors.js
// Display stored vectors from chunk_vectors in a readable format.
//
// Usage:
//   node scripts/inspect-vectors.js                  # first 5 rows
//   node scripts/inspect-vectors.js --limit 10       # first 10 rows
//   node scripts/inspect-vectors.js --chunk 42       # specific chunk_id
//   node scripts/inspect-vectors.js --dims 16        # show 16 dimensions

// import { Config } from '@punkish/zconfig';
// const config = new Config().settings;
// import { connect } from '../../data-dictionary/dbconn.js';
// import { logger } from './lib/logger.js';
import { VECTOR_DIM } from './lib/config.js';
import { DbConnection } from '../../lib/dbconn.js';
const args   = process.argv.slice(2);
const limit  = Number(args[args.indexOf('--limit')  + 1] ?? 5);
const chunkId = args.includes('--chunk') ? Number(args[args.indexOf('--chunk') + 1]) : null;
const dims   = Number(args[args.indexOf('--dims')   + 1] ?? 8);

const db = new DbConnection().getDb();
const query = chunkId != null
    ? db.prepare(`
        SELECT chunk_id, treatments_id, vector 
        FROM chunk_vectors WHERE chunk_id = ?
    `)
    : db.prepare(`
        SELECT chunk_id, treatments_id, vector 
        FROM chunk_vectors LIMIT ?
    `);

const rows = chunkId != null ? query.all(chunkId) : query.all(limit);

if (rows.length === 0) {
    console.log('No rows found.');
    db.close();
    process.exit(0);
}

// ── helpers ───────────────────────────────────────────────────────────────────

function blobToFloat32(blob) {

    // better-sqlite3 returns BLOBs as Node.js Buffer (a Uint8Array subclass).
    // We need the underlying ArrayBuffer at the correct offset.

    // Using slice copies the data into a new buffer. Modifying this array 
    // does not affect the original blob.
    return new Float32Array(
        blob.buffer.slice(
            blob.byteOffset, 
            blob.byteOffset + blob.byteLength
        )
    );
}

function formatVector(vec, showDims) {
    const preview = Array.from(vec.slice(0, showDims))
        .map(v => v.toFixed(6).padStart(10))
        .join(', ');
    const suffix = vec.length > showDims ? `, … (${vec.length} total)` : '';
    return `[${preview}${suffix}]`;
}

function vectorStats(vec) {
    const min  = Math.min(...vec).toFixed(6);
    const max  = Math.max(...vec).toFixed(6);
    const mean = (vec.reduce((a, b) => a + b, 0) / vec.length).toFixed(6);
    const norm = Math.sqrt(vec.reduce((a, v) => a + v * v, 0)).toFixed(6);
    return `min=${min}  max=${max}  mean=${mean}  L2norm=${norm}`;
}

// ── output ────────────────────────────────────────────────────────────────────

for (const row of rows) {
    const vec = blobToFloat32(row.vector);

    // Sanity check: warn if the blob doesn't look like a valid float32 vector
    if (vec.length !== VECTOR_DIM) {
        console.warn(`  ⚠  chunk_id=${row.chunk_id}: expected ${VECTOR_DIM} dims, got ${vec.length}`);
    }

    console.log(`chunk_id=${row.chunk_id}  treatments_id=${row.treatments_id}`);
    console.log(`  vector : ${formatVector(vec, dims)}`);
    console.log(`  stats  : ${vectorStats(vec)}`);
    console.log();
}

db.close();