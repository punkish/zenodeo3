// config.js -- orig
// ─────────────────────────────────────────────────────────────────────────────
// Central configuration for the treatments vector-index pipeline.
//
// Environment detection:
//   NODE_ENV=production  →  VPS profile  (Ubuntu, 8 vCPU, 24 GB shared RAM)
//   NODE_ENV=development →  Dev profile  (macOS M1 Pro, 10 cores, 16 GB 
//      unified RAM, GPU)
//   (default: development)
//
// Every value can be overridden with an environment variable.
// ─────────────────────────────────────────────────────────────────────────────

import os from 'os';

const ENV  = process.env.NODE_ENV ?? 'development';
const PROD = ENV === 'production';

// ── Paths ─────────────────────────────────────────────────────────────────────
export const DB_PATH = process.env.DB_PATH ?? './data/treatments.db';
export const USEARCH_INDEX_PATH = process.env.USEARCH_INDEX_PATH ?? './data/db/vectors/treatments.usearch';
export const ZVEC_INDEX_PATH = process.env.ZVEC_INDEX_PATH   ?? './data/db/vectors/zvec_collection';

// ── Embedding model (Ollama) ───────────────────────────────────────────────────
export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
export const EMBED_MODEL = process.env.EMBED_MODEL     ?? 'nomic-embed-text';
export const VECTOR_DIM = 768;   // nomic-embed-text output dimension

// ── Chunking ──────────────────────────────────────────────────────────────────
export const CHUNK_SIZE = 1024;   // characters (≈256 tokens)
export const CHUNK_OVERLAP = 128;    // characters

// ── Throughput (auto-scaled by environment) ───────────────────────────────────
export const EMBED_CONCURRENCY = PROD ? 1 : 2;
export const DB_BATCH_SIZE = PROD ? 100 : 200;
export const BATCH_PAUSE_MS = PROD ? 400 : 100;
//export const LOG_INTERVAL = 500;   // log every N treatments

// ── Index on/off and rebuild switches ────────────────────────────────────────
//
// enabled:      include this index when running the indexer and searcher
// forceRebuild: wipe and rebuild ONLY this index on the next run,
//               leaving chunks and stored vectors untouched
//
// Setting forceRebuild=true does NOT re-chunk or re-embed — it only clears
// the index-specific store (vec0 table, .usearch file, etc.) and re-populates
// it from the stored vectors in the `chunk_vectors` table.
// Reset to false after the rebuild completes.
//
// forceReembed: re-run Ollama on every chunk even if a vector already exists
//               in chunk_vectors. Use only when switching embedding models.
// Reset to false after the re-embed completes.
export const REBUILD = {
    forceReembed:       envBool('FORCE_REEMBED',         false),

    sqliteVec:          envBool('FORCE_REBUILD_SQLITE_VEC',    false),
    sqliteVector:       envBool('FORCE_REBUILD_SQLITE_VECTOR', false),
    usearch:            envBool('FORCE_REBUILD_USEARCH',       false),
    zvec:               envBool('FORCE_REBUILD_ZVEC',          false),
};
export const INDEXES = {
    sqliteVec:    envBool('INDEX_SQLITE_VEC',    false),
    sqliteVector: envBool('INDEX_SQLITE_VECTOR', false),
    usearch:      envBool('INDEX_USEARCH',       true),
    zvec:         envBool('INDEX_ZVEC',          false),  // Node.js SDK not yet stable
};

// ── sqlite-vec (asg017/sqlite-vec) ───────────────────────────────────────────
// Brute-force KNN inside SQLite. Vectors stored in a vec0 virtual table.
// Quantization: 'f32' | 'int8' | 'bit'
// int8 cuts storage ~4x with minimal accuracy loss on nomic-embed-text.
export const SQLITE_VEC = {
    quantization: PROD ? 'int8' : 'f32',
    table: 'vec_treatments',
    schema: 'vec0'
};

// ── sqlite-vector (@sqliteai/sqlite-vector) ───────────────────────────────────
// HNSW-capable SQLite extension from sqliteai. Vectors stored as BLOBs.
// License: Elastic 2.0 — check compliance for your use case.
export const SQLITE_VECTOR = {
    table: 'svec_treatments',   // ordinary SQLite table with BLOB column
    type:  'FLOAT32',
    schema: 'vec1'
};

// ── usearch (unum-cloud/usearch) ──────────────────────────────────────────────
// HNSW in-process index, persisted to a .usearch file.
export const USEARCH = {
    metric:            'cos',
    connectivity:      PROD ? 16 : 32,
    expansionAdd:      PROD ? 128 : 200,
    expansionSearch:   64,
};

// ── zvec (alibaba/zvec) ────────────────────────────────────────────────────────
// In-process vector database backed by Alibaba's Proxima engine.
// npm install @zvec/zvec
// Supported platforms: Linux x86_64, Linux ARM64, macOS ARM64.
export const ZVEC = {
    collectionName: 'treatments',
    metric:         'cosine',   // 'cosine' | 'l2' | 'ip'

    // Resource governance — critical on the shared-RAM production VPS.
    // optimizeThreads: threads used during index build (CPU-intensive).
    // queryThreads:    threads used during search.
    // Keep both low in production to avoid starving other processes.
    optimizeThreads: PROD ? 2 : 4,
    queryThreads:    PROD ? 2 : 4,
};

// ── Helper ────────────────────────────────────────────────────────────────────
function envBool(key, defaultVal) {
    if (key in process.env) return process.env[key] !== '0' && process.env[key] !== 'false';
    return defaultVal;
}

// export function log(...args) {
//     console.log(new Date().toISOString(), `[${ENV}]`, ...args);
// }
